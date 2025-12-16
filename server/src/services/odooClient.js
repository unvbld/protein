import xmlrpc from 'xmlrpc';
import { URL } from 'url';

class OdooClient {
    constructor() {
        this.odooUrl = process.env.ODOO_URL || 'http://localhost:8069';
        this.db = process.env.ODOO_DB || '';
        this.username = null;
        this.password = null;
        this.uid = null;

        // Parse URL for xmlrpc client
        const parsedUrl = new URL(this.odooUrl);
        this.host = parsedUrl.hostname;
        // parsedUrl.port returns string or empty, need to parse to int properly
        this.port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (parsedUrl.protocol === 'https:' ? 443 : 8069);
        this.secure = parsedUrl.protocol === 'https:';

        // Debug logging
        console.log('🔧 Odoo Client Configuration:');
        console.log('   URL:', this.odooUrl);
        console.log('   Host:', this.host);
        console.log('   Port:', this.port, typeof this.port);
        console.log('   DB:', this.db);
    }

    /**
     * Get XML-RPC client for common endpoint
     */
    getCommonClient() {
        const clientOptions = {
            host: this.host,
            port: this.port,
            path: '/xmlrpc/2/common'
        };

        return this.secure
            ? xmlrpc.createSecureClient(clientOptions)
            : xmlrpc.createClient(clientOptions);
    }

    /**
     * Get XML-RPC client for object endpoint
     */
    getObjectClient() {
        const clientOptions = {
            host: this.host,
            port: this.port,
            path: '/xmlrpc/2/object'
        };

        return this.secure
            ? xmlrpc.createSecureClient(clientOptions)
            : xmlrpc.createClient(clientOptions);
    }

    /**
     * Authenticate user with Odoo
     * @param {string} username - Odoo username
     * @param {string} password - Odoo password
     * @returns {Promise<number>} User ID
     */
    async authenticate(username, password) {
        return new Promise((resolve, reject) => {
            const client = this.getCommonClient();

            client.methodCall('authenticate', [this.db, username, password, {}], (err, uid) => {
                if (err) {
                    console.error('Odoo authentication error:', err);
                    return reject(new Error('Authentication failed'));
                }

                if (!uid) {
                    return reject(new Error('Invalid credentials'));
                }

                this.uid = uid;
                this.username = username;
                this.password = password;
                console.log(`✅ Authenticated as user ID: ${uid} (${username})`);
                resolve(uid);
            });
        });
    }

    /**
     * Ensure client is authenticated for backend operations
     */
    async ensureAuthenticated() {
        if (!this.uid || !this.username || !this.password) {
            // Auto-authenticate with admin credentials
            const adminUser = process.env.ODOO_ADMIN_USERNAME;
            const adminPass = process.env.ODOO_ADMIN_PASSWORD;

            if (!adminUser || !adminPass) {
                throw new Error('Admin credentials not configured in .env');
            }

            console.log('🔐 Auto-authenticating with admin credentials for backend operation...');
            await this.authenticate(adminUser, adminPass);
        }
    }

    /**
     * Execute Odoo method
     * @param {string} model - Odoo model name (e.g., 'product.product')
     * @param {string} method - Method name (e.g., 'search', 'read', 'create')
     * @param {Array} args - Method arguments
     * @param {Object} kwargs - Keyword arguments
     * @returns {Promise<any>} Result from Odoo
     */
    async execute(model, method, args = [], kwargs = {}) {
        // Auto-authenticate if not authenticated
        await this.ensureAuthenticated();

        return new Promise((resolve, reject) => {
            const client = this.getObjectClient();

            const params = [
                this.db,
                this.uid,
                this.password,
                model,
                method,
                args,
                kwargs
            ];

            client.methodCall('execute_kw', params, (err, result) => {
                if (err) {
                    console.error(`Odoo execute error on ${model}.${method}:`, err);
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    /**
     * Search records in Odoo
     * @param {string} model - Odoo model
     * @param {Array} domain - Search domain
     * @param {Object} options - Additional options (offset, limit, order)
     * @returns {Promise<Array>} Array of record IDs
     */
    async search(model, domain = [], options = {}) {
        return this.execute(model, 'search', [domain], options);
    }

    /**
     * Read records from Odoo
     * @param {string} model - Odoo model
     * @param {Array<number>} ids - Record IDs
     * @param {Array<string>} fields - Fields to read
     * @returns {Promise<Array>} Array of records
     */
    async read(model, ids, fields = []) {
        const kwargs = fields.length > 0 ? { fields } : {};
        return this.execute(model, 'read', [ids], kwargs);
    }

    /**
     * Search and read records
     * @param {string} model - Odoo model
     * @param {Array} domain - Search domain
     * @param {Array<string>} fields - Fields to read
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Array of records
     */
    async searchRead(model, domain = [], fields = [], options = {}) {
        const kwargs = { ...options };
        if (fields.length > 0) {
            kwargs.fields = fields;
        }
        return this.execute(model, 'search_read', [domain], kwargs);
    }

    /**
     * Create record in Odoo
     * @param {string} model - Odoo model
     * @param {Object} values - Field values
     * @returns {Promise<number>} Created record ID
     */
    async create(model, values) {
        return this.execute(model, 'create', [[values]]);
    }

    /**
     * Update record in Odoo
     * @param {string} model - Odoo model
     * @param {number|Array<number>} ids - Record ID(s)
     * @param {Object} values - Field values to update
     * @returns {Promise<boolean>} Success status
     */
    async write(model, ids, values) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        return this.execute(model, 'write', [idArray, values]);
    }

    /**
     * Delete (unlink) record in Odoo
     * @param {string} model - Odoo model
     * @param {number|Array<number>} ids - Record ID(s)
     * @returns {Promise<boolean>} Success status
     */
    async unlink(model, ids) {
        const idArray = Array.isArray(ids) ? ids : [ids];
        return this.execute(model, 'unlink', [idArray]);
    }

    /**
     * Get user information
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User information
     */
    async getUserInfo(userId) {
        const users = await this.read('res.users', [userId], [
            'name',
            'login',
            'email',
            'groups_id'
        ]);
        return users[0];
    }

    /**
     * Check if user has specific group/permission
     * @param {number} userId - User ID
     * @param {string} groupXmlId - Group XML ID (e.g., 'point_of_sale.group_pos_user')
     * @returns {Promise<boolean>}
     */
    async userHasGroup(userId, groupXmlId) {
        try {
            const result = await this.execute('res.users', 'has_group', [groupXmlId]);
            return result;
        } catch (error) {
            console.error('Error checking user group:', error);
            return false;
        }
    }
}

// Export factory function instead of singleton
// This ensures the client is created AFTER dotenv.config() is called
let _instance = null;

export default function getOdooClient() {
    if (!_instance) {
        _instance = new OdooClient();
    }
    return _instance;
}

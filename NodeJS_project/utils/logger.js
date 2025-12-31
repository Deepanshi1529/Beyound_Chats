class Logger {
    static info(message) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
    }

    static success(message) {
        console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`);
    }

    static warn(message) {
        console.log(`[WARN] ${new Date().toISOString()} - ${message}`);
    }

    static error(message, error = null) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
        if (error) {
            console.error(error);
        }
    }

    static step(stepNumber, message) {
        console.log(`[STEP ${stepNumber}] ${message}`);
    }

    static divider() {
        console.log('='.repeat(60));
    }
}

module.exports = Logger;
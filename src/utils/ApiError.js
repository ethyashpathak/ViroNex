//feel free to use it anywhere in your code

// Think of it as an "error manager" that gives more info than normal Error
class ApiError extends Error {
    constructor(
        statusCode,                          // like 404 (not found), 500 (server error) etc.
        message = "Something went wrong",    // default message if we don’t pass anything
        errors = [],                         // extra details if needed (like validation fails)
        stack = ""                           // stack trace = where error happened
    ) {
        super(message); // call the normal Error class with our message

        // add some extra stuff so API responses are cleaner
        this.statusCode = statusCode;  // which HTTP code to send back(refer to sir's lecture abt http/https)
        this.data = null;              // no data when there’s an error(hardcoded,pretty obv)
        this.message = message;        // the main error message
        this.success = false;          // always false since this is an error
        this.errors = errors;          // extra details (optional)

        // handle stack trace (helps in debugging)
        if (stack) {
            this.stack = stack; // if someone gave us a custom one
        } else {
            Error.captureStackTrace(this, this.constructor); 
            // else just grab where it broke in the code
        }
    }
}

export { ApiError }

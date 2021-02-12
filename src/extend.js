'use strict';

// Utility function to extend a prototype.
// Can be used to concatenate objects of functions.

let extend = function(prototype, functions)
{
    if (typeof prototype !== 'object' || typeof functions !== 'object')
        throw Error(`Could not extend ${prototype} with ${functions}.`);

    for (let property in functions)
    {
        if (prototype.hasOwnProperty(property))
            throw Error(`Tried to override existing property ${property}`);

        if (functions.hasOwnProperty(property)) {
            let f = functions[property];
            if (typeof f !== 'function')
                throw Error(`Could not extend prototype with ${f}`);

            else
                prototype[property] = functions[property];
        }
    }
};

let inherit = function(derived, parent)
{
    if (typeof derived !== 'function' || typeof parent !== 'function')
        throw Error(`Could not inherit from/to non-function: ${derived} / ${parent}.`);

    derived.prototype = Object.assign(Object.create(parent.prototype), {
        constructor: derived,
        super: parent.prototype
    });
};

let assert = function(expr, msg)
{
    if (!expr)
    {
        console.warn(`[assert failed] ${msg}`);
    }
};

export { extend as default, assert, inherit };

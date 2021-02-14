'use strict';

// Utility function to extend a prototype.
// Can be used to concatenate objects of functions.

let extend = function(prototype, functions)
{
    if (typeof prototype !== 'object' || typeof functions !== 'object')
        throw Error(`[Extend] Could not extend ${prototype} with ${functions}.`);

    for (let property in functions)
    {
        if (!functions.hasOwnProperty(property)) continue;

        let f = functions[property];

        if (prototype.hasOwnProperty(property))
        {
            throw Error(`[Extend] Tried to override existing property ${property}`);
        }
        if (property in prototype)
        {
            // console.log(`[Extend] Shortcut override ${property}.`);

            if (!prototype.super)
                throw Error(`[Extend] Cannot add ${property} to super.`);

            // Save old property into super.
            prototype.super[property] = prototype[property];
        }

        if (typeof f !== 'function')
            throw Error(`[Extend] Could not extend prototype with ${f}`);

        prototype[property] = f;
    }
};

let inherit = function(derived, parent)
{
    if (typeof derived !== 'function' || typeof parent !== 'function')
        throw Error(`[Inherit] Could not inherit from/to non-function: ${derived} / ${parent}.`);

    derived.prototype = Object.assign(Object.create(parent.prototype), {
        constructor: derived,
        super: Object.create(null) // parent.prototype
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

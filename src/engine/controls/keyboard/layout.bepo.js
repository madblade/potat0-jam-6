/**
 * (the superior layout)
 */

'use strict';

let LayoutBEPO = {

    getBEPO()
    {
        return Object.freeze({
            // Arrow directional controls.
            arrowUp: 38,
            arrowDown: 40,
            arrowRight: 39,
            arrowLeft: 37,

            // Left hand directional controls.
            leftHandUp: 186,    // É
            leftHandLeft: 65,   // A
            leftHandDown: 85,   // U
            leftHandRight: 73,  // I

            // Left hand advanced controls.
            leftHandNorthWest: 66,     // b
            leftHandNorthEast: 80,     // p
            leftHandNorthEast2: 79,    // o
            leftHandEast2: 69,         // e
            leftHandSouthWest: 221,    // à
            leftHandSouth: 89,         // y
            leftHandSouthEast: 88,     // x

            // Modifiers.
            alt: 18,
            shift: 16,
            control: 17,
            tab: 9,

            // Misc.
            escape: 27,
            space: 32,
            backspace: 8,
            enter: 13,
            pageUp: 33,
            pageDown: 34,

            // Number line.
            one: 49,
            two: 50,
            three: 51,
            four: 52,
            five: 53,
            six: 54,
            seven: 55,
            eight: 56,
            nine: 57,

            // Number pad.
            // 1. if verr.num is activated.
            padOne: 97,
            padTwo: 98,
            padThree: 99,
            padFour: 100,
            padFive: 101,
            padSix: 102,
            padSeven: 103,
            padEight: 104,
            padNine: 105,
            // 2. if verr.num is not activated
            padOneAlt: 35,
            padTwoAlt: 40,
            padThreeAlt: 34,
            padFourAlt: 37,
            padFiveAlt: 12,
            padSixAlt: 39,
            padSevenAlt: 36,
            padEightAlt: 38,
            padNineAlt: 33,

            // All other letters
            leftHandNorthEast3: 84,     // T
            leftHandEast3: 71,          // G
            leftHandSouthEast3: 86,     // V

            rightHandUp: 68,            // I
            rightHandDown: 83,          // K
            rightHandLeft: 84,          // J
            rightHandLeft2: 67,         // H
            rightHandRight: 82,         // L
            rightHandRight2: 78,        // M
            rightHandSouth: 71,         // .

            rightHandNorthWest: 86,     // U
            rightHandNorthWest2: 219,   // Y
            rightHandNorthEast: 76,     // O
            rightHandNorthEast2: 74,    // P
            rightHandSouthWest: 81,     // ,
            rightHandSouthWest2: 192,   // N
            rightHandSouthWest3: 75,    // B
            rightHandSouthEast: 72,     // /
            rightHandSouthEast2: 70     // ß

        });
    }
};

export { LayoutBEPO };

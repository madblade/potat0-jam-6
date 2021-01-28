/**
 * (c) madblade 2021 all rights reserved
 */

let PhysicsInputModule = {

    pushEvent(e)
    {
        let vector = [0, 0, 0];
        if (e[0] !== 'm') return;
        switch (e[1])
        {
            case 'f':
                vector[0] = 1;
                break;
            case 'b':
                vector[0] = -1;
                break;
            case 'r':
                vector[1] = -1;
                break;
            case 'l':
                vector[1] = 1;
                break;
            case 'u':
                vector[2] = 1;
                break;
            case 'd':
                vector[2] = -1;
                break;
            case 'fx':
            case 'bx':
            case 'rx':
            case 'lx':
            case 'ux':
            case 'dx':
                break;
            default:
                return;
        }
        // TODO bind
    }

};

export { PhysicsInputModule };

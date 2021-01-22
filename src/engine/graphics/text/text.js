import { Label }   from './label';

let TextModule = {

    createTextLabel(text)
    {
        if (!text) text = 'hi there!';
        return new Label(text);
    },

};

export { TextModule };

import { Label } from './label';
import { Title } from './Title';

let TextModule = {

    createTextLabel(text)
    {
        if (!text) text = 'hi there!';
        return new Label(text);
    },

    createTitleLabel(text)
    {
        const t = new Title(text);
        t.center();
        return t;
    },

};

export { TextModule };

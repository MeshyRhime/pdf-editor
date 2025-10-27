
export enum Tool {
    Select = 'SELECT',
    Text = 'TEXT',
    Checkmark = 'CHECKMARK'
}

export interface Edit {
    id: string;
    page: number;
    x: number;
    y: number;
    type: Tool;
}

export interface TextEdit extends Edit {
    type: Tool.Text;
    content: string;
    fontSize: number;
    width?: number;
}

export interface CheckmarkEdit extends Edit {
    type: Tool.Checkmark;
    size: number;
}

export type AnyEdit = TextEdit | CheckmarkEdit;

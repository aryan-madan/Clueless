export interface Item {
    id: string;
    src: string;
    at: number;
}

export interface Props {
    tab?: string;
    set?: (val: string) => void;
    data?: Item[];
    done?: () => void;
}
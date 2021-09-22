export interface createHeader {
    /**
    * Create a centered and optionally uppercased header padded equally on both sides with a custom padder string
    */
    (header: string, options: {
        padder: string | {left: string, right: string},
        length: number,
        center: boolean,
        upper: boolean
    }): string;
}

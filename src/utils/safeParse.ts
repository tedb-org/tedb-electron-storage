
export const safeParse = (data: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            const json = JSON.parse(data);
            resolve(json);
        } catch (e) {
            resolve(false);
        }
    });
};

export const parseJSON = (data: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            const json = JSON.parse(data);
            resolve(json);
        } catch (e) {
            return reject(new Error(':::Storage::: parseJSON Error.'));
        }
    });
};


export const parseJSON = (data: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        try {
            if (Object.prototype.toString.call(data) === '[object Object]') {
                resolve(data);
            } else if (Object.prototype.toString.call(data) === '[object, Array]'){
                resolve(data);
            } else {
                const json = JSON.parse(data);
                resolve(json);
            }
        } catch (e) {
            return reject(new Error(':::Storage::: parseJSON Error.' + e));
        }
    });
};

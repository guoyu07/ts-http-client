
declare var fetch: (url: string, options: any) => Promise<any>;

export interface IServiceClientRequestOptions {
    headers?: {[prop: string]: string};
}

export interface IFetchClientRequestOptions extends IServiceClientRequestOptions {
    baseUrl?: string;
    method?: string;
    url?: string;
    data?: any;
    files?: any[];
}

export interface IFetchResponse {
    body: any;
    bodyUsed: boolean;
    headers: any;
    ok: boolean;
    status: number;
    statusText: string;
    type: string;
    url: string;
    json: () => Promise <any>;
    text: () => Promise <any>;
}

export interface IFetchClientMiddleware {
    (config: IFetchClientRequestOptions, next: (options: IFetchClientRequestOptions) => Promise<any>):
        void | IFetchClientRequestOptions | FetchClientResponse<any>;
}

export class FetchClientConfiguration {

    static get defaults(): IFetchClientRequestOptions {
        return {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        };
    }

    options: IFetchClientRequestOptions;

    constructor(options?: IFetchClientRequestOptions) {
        this.options = options || {};
    }

    withBaseUrl(url: string): FetchClientConfiguration {
        // todo: fail on missing protocol.

        this.options.baseUrl = url;

        return this;
    }
}

export class FetchClient {

    static getCombinedUrl(baseUrl: string, urlOrPath: string): string {
        if (urlOrPath.indexOf("://") > -1) {
            return urlOrPath;
        }
        return (baseUrl || "") + urlOrPath;
    }

    protected configuration: FetchClientConfiguration;

    private middlewares: IFetchClientMiddleware[];
    private options;

    constructor() {
        this.configuration = new FetchClientConfiguration();
        this.middlewares = [];

        if (typeof fetch === "undefined") {
            throw new Error("fetch() is not defined. Are you missing a polyfill?");
        }
    }

    configure(fn: (config: FetchClientConfiguration) => void) {
        if (typeof fn === "function") {
            fn(this.configuration);
        } else {
            throw new Error("Expected a function to configure, got " + typeof fn + "instead");
        }
    }

    addMiddleware(func: IFetchClientMiddleware) {
        this.middlewares.push(func);
        return this;
    }

    fetch(url: string, options: IFetchClientRequestOptions = {}): Promise<FetchClientResponse<any>> {

        let httpClientRequestOptions: IFetchClientRequestOptions = Object.assign(
            {},
            FetchClientConfiguration.defaults,
            this.configuration.options,
            this.options,
            options);

        httpClientRequestOptions.url = url;

        // Create final middleware to perform actual fetch call
        let fetchMiddleware = (options: IFetchClientRequestOptions) => {
            options.url = FetchClient.getCombinedUrl(options.baseUrl, options.url);

            return fetch(options.url, options).then((response) => {
                return response.text().then((text) => {
                    return new FetchClientResponse(response, text);
                });
            });
        };

        let stack = this.middlewares.concat([fetchMiddleware]);

        let next = (options) => {
            let nextMW: IFetchClientMiddleware = stack.shift();
            return nextMW(options, next);
        };
        return next(httpClientRequestOptions);
    }
}

export class FetchClientResponse<T> {
    fetchResponse: IFetchResponse;
    body: any;

    get hasError(): boolean {
        return !this.fetchResponse.ok;
    }

    get status() {
        return this.fetchResponse.status;
    }

    get statusText() {
        return this.fetchResponse.statusText;
    }

    get contentType() {
        if (!this.fetchResponse.headers.has("Content-Type")) {
            return undefined;
        }
        return this.fetchResponse.headers.get("Content-Type").split(";")[0];
    }

    get ok() {
        return this.fetchResponse.ok;
    }

    get hasData(): boolean {
        return !(this.status === 204);
    }

    get data(): T {
        switch (this.contentType) {
            case "application/json":
                try {
                    return JSON.parse(this.body) as T;
                } catch (e) {
                    throw Error("Response body can't be parsed.");
                }
            case undefined:
            case "":
                return undefined;
        }

        throw new Error(`Unknown Content-Type "${this.contentType}"`);
    }

    constructor(fetchResponse: IFetchResponse, body: any) {
        this.fetchResponse = fetchResponse;
        this.body = body;
    }
}

export class ServiceClient extends FetchClient {

    constructor(baseUrl: string = undefined) {
        super();

        this.configure((config) => {
            if (baseUrl) {
                config.withBaseUrl(baseUrl);
            }
        });
    }

    request(method: string, url: string, data: any, files: any[], options: IServiceClientRequestOptions) {

        if (typeof method !== "string") {
            throw new Error("method must be a string");
        }

        if (["GET", "HEAD", "DELETE", "POST", "PATCH", "PUT"].indexOf(method) < 0) {
            throw new Error("method can be one of GET, HEAD, DELETE, PATCH, POST, PUT");
        }

        if (typeof url !== "string") {
            throw new Error("url must be a string");
        }

        if (typeof files !== "object" && typeof files !== "undefined") {
            throw new Error("files must be an object or undefined");
        }

        if (typeof options !== "object" && typeof options !== "undefined") {
            throw new Error("options must be an object or undefined");
        }

        // Validate method/parameter combinations
        if (method === "GET" || method === "HEAD") {
            if (data !== undefined) {
                throw new Error(`data cannot be defined on a ${method} call`);
            }
            if (files !== undefined) {
                throw new Error(`files cannot be defined on a ${method} call`);
            }
        }
        if (method === "DELETE" && files !== undefined) {
            throw new Error("files cannot be defined on a DELETE call");
        }

        let requestOptions: IFetchClientRequestOptions = options || {};

        requestOptions.method = method;
        requestOptions.url = url;
        requestOptions.data = data;
        requestOptions.files = files;

        return this.fetch(url, requestOptions);
    }

    get<T>(url: string, options?: IServiceClientRequestOptions): Promise<FetchClientResponse<T>> {
        return this.request("GET", url, undefined, undefined, options);
    }

    head<T>(url: string, options?: IServiceClientRequestOptions): Promise<FetchClientResponse<T>> {
        return this.request("HEAD", url, undefined, undefined, options);
    }

    delete<T>(url: string, data?: any, options?: IServiceClientRequestOptions): Promise<FetchClientResponse<T>> {
        return this.request("DELETE", url, data, undefined, options);
    };

    patch<T>(url: string, data?: any, files?: any, options?: IServiceClientRequestOptions): Promise<FetchClientResponse<T>> {
        return this.request("PATCH", url, data, files, options);
    };

    post<T>(url: string, data?: any, files?: any, options?: IServiceClientRequestOptions): Promise<FetchClientResponse<T>> {
        return this.request("POST", url, data, files, options);
    };

    put<T>(url: string, data?: any, files?: any, options?: IServiceClientRequestOptions): Promise<FetchClientResponse<T>> {
        return this.request("PUT", url, data, files, options);
    };

}

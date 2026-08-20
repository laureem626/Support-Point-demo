export declare const config: () => {
    app: {
        name: string | undefined;
        url: string | undefined;
        port: string | number;
    };
    database: {
        type: string;
        name: string | undefined;
        host: string;
        port: string;
        username: string | undefined;
        password: string | undefined;
    };
    redis: {
        host: string;
        port: string | number;
    };
    jwt: {
        secret_key: string | undefined;
    };
    synchronize_db_schema: string | undefined;
    autoload_entities: string | undefined;
};

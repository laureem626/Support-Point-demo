import { DataSource } from 'typeorm';
declare const _default: (() => {
    type: string;
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
    entities: string[];
    migrations: string[];
    autoLoadEntities: boolean;
    synchronize: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    type: string;
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
    entities: string[];
    migrations: string[];
    autoLoadEntities: boolean;
    synchronize: boolean;
}>;
export default _default;
export declare const connectionSource: DataSource;

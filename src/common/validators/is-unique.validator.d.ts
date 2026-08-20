import { ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
import { EntityManager } from 'typeorm';
export declare class IsUniqueConstraint implements ValidatorConstraintInterface {
    private readonly entityManager;
    constructor(entityManager: EntityManager);
    validate(value: any, args: ValidationArguments): Promise<boolean>;
    defaultMessage(args: ValidationArguments): string;
}
export declare function IsUnique(entity: string, isNumeric?: boolean, validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;

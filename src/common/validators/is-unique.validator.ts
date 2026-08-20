import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'isUniqueConstraint', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly entityManager: EntityManager) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const entity: string = args.constraints[0];
    const isNumeric: string = args.constraints[1];

    // Construct the query condition
    const queryCondition = isNumeric
      ? `"${args.property}" = :value` // Use equality for numbers
      : `CAST("${args.property}" AS TEXT) ILIKE :value`; // Cast to TEXT for strings

    // Query the database
    const isExist = await this.entityManager
      .getRepository(entity)
      .createQueryBuilder(entity)
      .where(queryCondition, { value: isNumeric ? value : `%${value}%` })
      .getOne();
    // const isExist = await this.entityManager
    //   .getRepository(entity)
    //   .createQueryBuilder(entity)
    //   .where(`"${args.property}" ILIKE :value`, { value: `%${value}%` })
    //   .getOne();

    return !isExist;
  }

  defaultMessage(args: ValidationArguments) {
    const { value, property } = args;
    return `${property} with value '${value}' already exists.`;
  }
}

export function IsUnique(
  entity: string,
  isNumeric: boolean = false,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [entity, isNumeric],
      validator: IsUniqueConstraint,
    });
  };
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsUniqueConstraint = void 0;
exports.IsUnique = IsUnique;
const class_validator_1 = require("class-validator");
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
let IsUniqueConstraint = class IsUniqueConstraint {
    entityManager;
    constructor(entityManager) {
        this.entityManager = entityManager;
    }
    async validate(value, args) {
        const entity = args.constraints[0];
        const isNumeric = args.constraints[1];
        const queryCondition = isNumeric
            ? `"${args.property}" = :value`
            : `CAST("${args.property}" AS TEXT) ILIKE :value`;
        const isExist = await this.entityManager
            .getRepository(entity)
            .createQueryBuilder(entity)
            .where(queryCondition, { value: isNumeric ? value : `%${value}%` })
            .getOne();
        return !isExist;
    }
    defaultMessage(args) {
        const { value, property } = args;
        return `${property} with value '${value}' already exists.`;
    }
};
exports.IsUniqueConstraint = IsUniqueConstraint;
exports.IsUniqueConstraint = IsUniqueConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isUniqueConstraint', async: true }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.EntityManager])
], IsUniqueConstraint);
function IsUnique(entity, isNumeric = false, validationOptions) {
    return (object, propertyName) => {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [entity, isNumeric],
            validator: IsUniqueConstraint,
        });
    };
}
//# sourceMappingURL=is-unique.validator.js.map
import {
    DeepPartial,
    FindOptionsWhere,
    ObjectLiteral,
    Repository
} from 'typeorm';

/**
 * Find or create an entity.
 * Returns the entity if it exists, otherwise creates it and returns it.
 * It returns a boolean to specify if the entity was created or not.
 * @param repository
 * @param where
 * @param create
 */
export default async function findOrCreate<T extends ObjectLiteral>(
    repository: Repository<T>,
    where: FindOptionsWhere<T>,
    create: DeepPartial<T>
): Promise<[T, boolean]> {
    const entity = await repository.findOneBy(where);
    if (entity) {
        return [entity, false];
    }
    return [await repository.save(create), true];
}

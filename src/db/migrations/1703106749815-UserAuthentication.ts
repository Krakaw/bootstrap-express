import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAuthentication1703106749815 implements MigrationInterface {
    name = 'UserAuthentication1703106749815';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user"
            (
                "created_at" TIMESTAMP         NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP         NOT NULL DEFAULT now(),
                "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
                "role"       character varying NOT NULL DEFAULT 'user',
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "login"
            (
                "created_at"  TIMESTAMP         NOT NULL DEFAULT now(),
                "updated_at"  TIMESTAMP         NOT NULL DEFAULT now(),
                "id"          uuid              NOT NULL DEFAULT uuid_generate_v4(),
                "user_id"     uuid              NOT NULL,
                "provider"    character varying NOT NULL,
                "provider_id" character varying NOT NULL,
                "metadata"    jsonb,
                CONSTRAINT "UQ_70b07e6a606e148f5ccfa4174e9" UNIQUE ("provider", "provider_id"),
                CONSTRAINT "PK_0e29aa96b7d3fb812ff43fcfcd3" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "login"
                ADD CONSTRAINT "FK_6da2fec3d330c1b6c67c427937e" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "login" DROP CONSTRAINT "FK_6da2fec3d330c1b6c67c427937e"
        `);
        await queryRunner.query(`
            DROP TABLE "login"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
    }
}

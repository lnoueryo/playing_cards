pm2 logs
pm2 kill

## migrate

migrationファイル作成
```
$ npx knex migrate:make create_users_table
```
マイグレーション
```
$ npx knex migrate:latest
```
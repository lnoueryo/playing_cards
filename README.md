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
カラム追加
```
$ npx knex migrate:make add_user_id_to_sessions
```
カラム削除
```
$npx knex migrate:make remove_column_from_users
```
制約削除
```
$npx knex migrate:make drop_unique_from_table_id
```
tsファイルを実行する
```
$npx ts-node ./node_modules/.bin/knex migrate:latest
```
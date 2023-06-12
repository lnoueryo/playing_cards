module.exports = {
    apps : [{
      name: "playing_cards",
      script: "./main.ts",
      // interpreter: "D:\\Program Files (x86)\\Nodist\\bin\\ts-node.cmd"
      // interpreter: "/usr/local/bin/node",
      // instances: "max", // 使用可能なCPUの数だけインスタンスを起動
      // autorestart: true, // フラグがtrueの場合、アプリケーションがクラッシュしたら自動的に再起動
      // watch: false, // 開発モードでは便利だが、本番環境では使用しない
      // max_memory_restart: "1G" // メモリ使用量がこの限度を超えたら、アプリケーションを再起動
    }]
  }
  
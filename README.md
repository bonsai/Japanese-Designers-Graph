# Japanese Designers Graph

日本のファッションデザイナー、ブランド、作品、デザイン概念の関係を探索するセマンティックグラフ。

## GitHub Pages

公開URL: https://bonsai.github.io/Japanese-Designers-Graph/

## デプロイ

- Workflow: [Deploy Pages](.github/workflows/dep.yml)
- `main` ブランチの `index.html`、`data/**`、`assets/**` の変更で自動デプロイ
- `workflow_dispatch` から手動実行も可能
- リポジトリの Settings → Pages → Build and deployment で **GitHub Actions** を選択してください（未設定の場合）

## データ

- `data/seeds.json`: グラフの初期ノード、関係、出典
- `data/recommendations.json`: 理由・関連ノード・信頼度・出典を持つ探索レコメンド
- `.github/workflows/recommend-designers.md`: gh-aw のレコメンド更新ワークフロー原稿。シード更新時・毎週・手動で候補を調査し、変更は draft PR で提案する
- `index.html`: 静的な検索・グラフ表示UI
- ブラウザで追加したノードは「JSON出力」でダウンロードできます。現段階ではブラウザからGitHubやSQLiteへ直接保存しません。

### gh-aw の有効化

Agentic Workflow の原稿を GitHub Actions として有効化するには、リポジトリのローカル checkout で GitHub CLI と `gh-aw` 拡張を利用し、コンパイル済み lock ファイルを原稿と一緒にコミットしてください。

```sh
gh extension install github/gh-aw
gh aw compile .github/workflows/recommend-designers.md
git add .github/workflows/recommend-designers.md .github/workflows/recommend-designers.lock.yml
git commit -m "Compile designer recommendation agentic workflow"
git push
```

レコメンドは直接 main に書き込まず、レビュー可能な draft PR として提案します。GitHub Actions の実行前に生成された lock ファイルと workflow の権限・出力を確認してください。

## 技術方針

- HTML / JavaScript: GitHub Pagesでの表示
- JSON: バージョン管理する正規データ
- Go + SQLite3: 今後の検証・インポート・検索API用の拡張候補
- 関係の根拠と確認状態を記録し、未確認情報を確定事実として扱わない

## ローカル確認

静的ファイルを `file://` で開くとJSONの取得が制限されるため、ローカルHTTPサーバー経由で確認してください。

```sh
python -m http.server 8000
```

その後 `http://localhost:8000/` を開きます。

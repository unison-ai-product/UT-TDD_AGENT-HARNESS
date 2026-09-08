# 閲覧HTMLの確認範囲

Chromiumへ生成HTMLを読み込ませ、初期表示、release文書の切替、本文検索を確認しました。1440×1100と390×844でページ全体の横方向はみ出しはなく、確認した操作中にJavaScript例外はありませんでした。

テスト環境ではfile URLが管理policyにより拒否されたため、ファイル直接オープンではなくChromiumの`set_content`で同じHTMLを読み込んでいます。ユーザー環境のすべてのブラウザ・企業policyでの動作を保証する検査ではありません。

この確認は**資料閲覧UI**に限ります。UTの生成view機能、BugBot、CI、移行処理、schedulerの製品実装を検証したものではありません。

[確認記録](data/viewer_validation.json) / [資料整合検査](VALIDATION.md) / [総目次](README.md)

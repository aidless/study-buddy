# study-buddy 验收入口。
# eval: 跑题库验收（20/20 才算合格），并把结果落盘到 eval/run-report.json。
# 既有测试（vitest + scripts/verify_qbank.mjs）依赖 Node ESM 能解析仓路径，
# 在含字面反斜杠的工作区路径下会报 ERR_INVALID_MODULE_SPECIFIER（见 README「环境说明」），
# 因此这里只跑 Python 侧题库；换到正常路径后请用 `npm test` 单独复算。
PY ?= python3

.PHONY: eval

eval:
	$(PY) eval/run_cases.py --save

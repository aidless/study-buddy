// qbankSeed.js —— 408 真题选择题汇总入口
import { SEED_QUESTIONS_A } from './SEED_QUESTIONS_A.js'
import { SEED_QUESTIONS_B } from './SEED_QUESTIONS_B.js'
import { SEED_QUESTIONS_C } from './SEED_QUESTIONS_C.js'
export const SEED_QUESTIONS = [...SEED_QUESTIONS_A, ...SEED_QUESTIONS_B, ...SEED_QUESTIONS_C]
export const SEED_META = { count: SEED_QUESTIONS.length, years: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] }

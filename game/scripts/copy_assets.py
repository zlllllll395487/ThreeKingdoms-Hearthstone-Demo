"""
批量复制资源 · 把切图结果 + 组件2.0 整理到 game/src/assets/ui/
中文文件名 → 英文 canonical 命名
"""
import os
import shutil
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.abspath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(ROOT, '..'))
ASSETOFSANGUO = os.path.abspath(os.path.join(PROJECT_ROOT, '..', 'assetofsanguo'))
DEST = os.path.join(PROJECT_ROOT, 'src', 'assets', 'ui')

os.makedirs(DEST, exist_ok=True)

# 映射表 (源相对路径, 目标文件名)
COPY_MAP = [
    # 边框
    ('切图结果/边框和面板/普通.png',     'frame_common.png'),
    ('切图结果/边框和面板/稀有.png',     'frame_rare.png'),
    ('切图结果/边框和面板/史诗.png',     'frame_epic.png'),
    ('切图结果/边框和面板/传说.png',     'frame_legendary.png'),
    # 名字横幅（3 档）
    ('切图结果/边框和面板/短面板.png',   'name_short.png'),
    ('切图结果/边框和面板/中面板.png',   'name_medium.png'),
    ('切图结果/边框和面板/长面板.png',   'name_long.png'),
    # 5 阵营印章
    ('切图结果/五个阵营/蜀.png',         'emblem_shu.png'),
    ('切图结果/五个阵营/魏.png',         'emblem_wei.png'),
    ('切图结果/五个阵营/吴.png',         'emblem_wu.png'),
    ('切图结果/五个阵营/群.png',         'emblem_qun.png'),
    ('切图结果/五个阵营/中.png',         'emblem_neutral.png'),
    # 13 关键词印章
    ('切图结果/十三种异常状态/镇.png',   'kw_taunt.png'),
    ('切图结果/十三种异常状态/冲.png',   'kw_charge.png'),
    ('切图结果/十三种异常状态/袭.png',   'kw_rush.png'),
    ('切图结果/十三种异常状态/伏.png',   'kw_stealth.png'),
    ('切图结果/十三种异常状态/壁.png',   'kw_divineshield.png'),
    ('切图结果/十三种异常状态/斩.png',   'kw_windfury.png'),
    ('切图结果/十三种异常状态/毒.png',   'kw_poisonous.png'),
    ('切图结果/十三种异常状态/饮.png',   'kw_lifesteal.png'),
    ('切图结果/十三种异常状态/困.png',   'kw_freeze.png'),
    ('切图结果/十三种异常状态/威.png',   'kw_battlecry.png'),
    ('切图结果/十三种异常状态/遗.png',   'kw_deathrattle.png'),
    ('切图结果/十三种异常状态/谋.png',   'kw_spellpower.png'),
    ('切图结果/十三种异常状态/离.png',   'kw_silence.png'),
    # 10 个费用宝石
    *[(f'切图结果/十个费用/费{i}.png', f'cost_{i}.png') for i in range(1, 11)],
    # 10 个攻击球
    *[(f'切图结果/十个攻击/攻{i}.png', f'attack_{i}.png') for i in range(1, 11)],
    # 10 个血量球
    *[(f'切图结果/十个血量/血{i}.png', f'health_{i}.png') for i in range(1, 11)],
    # 主要 UI logo / 按钮 / 文字
    ('组件2.0/三国炉石logo.png',         'logo_main.png'),
    ('组件2.0/卡牌图鉴logo.png',         'logo_codex.png'),
    ('组件2.0/开始对战.png',             'btn_battle_start.png'),
    ('组件2.0/胜.png',                   'text_victory.png'),
    ('组件2.0/负.png',                   'text_defeat.png'),
    ('组件2.0/splash加载页.png',         'splash_full.png'),
]


def main():
    copied = 0
    missing = []
    for src_rel, dst_name in COPY_MAP:
        src = os.path.join(ASSETOFSANGUO, src_rel)
        dst = os.path.join(DEST, dst_name)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            copied += 1
            print(f'  ✓ {dst_name:<32}  ← {src_rel}')
        else:
            missing.append(src_rel)
            print(f'  ✗ {dst_name:<32}  缺失：{src_rel}')

    print(f'\n📦 已复制 {copied} 个文件，缺失 {len(missing)} 个')
    if missing:
        print(f'\n⚠️ 缺失清单：')
        for m in missing:
            print(f'   - {m}')


if __name__ == '__main__':
    main()

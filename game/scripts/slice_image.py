"""
智能切图工具 · 自动识别印章/图标位置

原理：
  AI 生成的组合图中，独立元素之间有透明（或近黑色）的间隙。
  通过列扫描找到这些间隙列，把图分成 N 个等大子图。

用法：
  python scripts/slice_image.py
"""
from PIL import Image
import os
import sys
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SOURCE_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, '..', 'assetofsanguo', '组件2.0'))
OUTPUT_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, '..', 'assetofsanguo', '切图结果'))


def find_content_columns(im: Image.Image, threshold: float = 0.03):
    """
    扫描每一列，返回该列有内容的比例（0~1）。
    阈值默认 3%：少于 3% 像素有内容的列视为间隙列。
    """
    arr = np.array(im.convert('RGBA'))
    # alpha 通道 > 30 视为"有内容"，并且亮度 > 20
    rgb_lum = arr[:, :, :3].mean(axis=2)
    has_content = (arr[:, :, 3] > 30) & (rgb_lum > 20)
    col_density = has_content.mean(axis=0)  # 每列的内容密度
    return col_density, has_content


def find_segments(col_density: np.ndarray, gap_threshold: float = 0.05):
    """
    找出连续的"有内容"段。
    返回 [(left, right), ...]，左闭右开。
    """
    is_content = col_density > gap_threshold
    segments = []
    in_seg = False
    seg_start = 0
    for i, v in enumerate(is_content):
        if v and not in_seg:
            in_seg = True
            seg_start = i
        elif not v and in_seg:
            in_seg = False
            segments.append((seg_start, i))
    if in_seg:
        segments.append((seg_start, len(is_content)))
    return segments


def smart_slice(src_path: str, expected_count: int, names: list[str]):
    """
    智能切图 v3：
    1. 找出独立段
    2. 推断每段含几个印章（按段宽 / 标准宽）
    3. 在每段内按印章数等分，找每个印章的中心
    4. 围绕中心按 92% 印章宽裁切（避免吃到邻居）
    """
    im = Image.open(src_path).convert('RGBA')
    w, h = im.size
    print(f'\n📦 智能切 {os.path.basename(src_path)}: {w}×{h} → {expected_count} 份')

    col_density, _ = find_content_columns(im)
    segments = find_segments(col_density)

    # 推断单个印章的标准宽度
    if len(segments) == expected_count:
        unit_w = sum(r - l for l, r in segments) / expected_count
    else:
        # 用最短的段（最可能是单个印章）作为标准
        seg_widths = sorted(r - l for l, r in segments)
        unit_w = seg_widths[0]
    print(f'  推断单印章标准宽度: {unit_w:.1f}px')

    # 把每段拆成 N 个印章中心
    centers = []  # 每个印章的 (center_x, half_width)
    for left, right in segments:
        seg_w = right - left
        n = max(1, round(seg_w / unit_w))
        sub_w = seg_w / n
        for k in range(n):
            cx = left + sub_w * (k + 0.5)
            centers.append((cx, sub_w))

    if len(centers) != expected_count:
        print(f'  ⚠️ 推断出 {len(centers)} 个印章，期望 {expected_count}。回退到完全等分。')
        piece_w = w / expected_count
        centers = [(piece_w * (i + 0.5), piece_w) for i in range(expected_count)]

    print(f'  共定位 {len(centers)} 个印章中心')

    # 裁切：每个印章用其完整推断宽度（不缩减，保证边缘不被切）
    # 用所有印章的最小宽度作为统一裁切宽度
    min_unit_w = min(sw for _, sw in centers)
    crop_w = max(8, int(round(min_unit_w)))  # 100% 印章宽度，保证完整
    half = crop_w // 2

    # 统一画布尺寸（留 1px 边缘安全区）
    pad = 2
    output_w = crop_w + pad * 2
    output_h = h

    for i, (cx, _) in enumerate(centers):
        left = max(0, int(round(cx)) - half)
        right = min(w, left + crop_w)
        if right - left < crop_w:
            left = max(0, right - crop_w)
        piece = im.crop((left, 0, right, h))

        canvas = Image.new('RGBA', (output_w, output_h), (0, 0, 0, 0))
        offset_x = (output_w - piece.width) // 2
        canvas.paste(piece, (offset_x, 0), piece)

        out_path = os.path.join(OUTPUT_DIR, f'{names[i]}.png')
        canvas.save(out_path, optimize=True)
        print(f'  [{i+1:2d}] {names[i]}.png  中心 x={cx:.1f}  裁切宽 {crop_w}px  → {output_w}×{output_h}')


def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 关键词印章 · 13 个（顺序 镇 冲 袭 伏 壁 斩 毒 饮 困 威 遗 谋 离）
    kw_names = [
        'badge_kw_taunt',
        'badge_kw_charge',
        'badge_kw_rush',
        'badge_kw_stealth',
        'badge_kw_divineshield',
        'badge_kw_windfury',
        'badge_kw_poisonous',
        'badge_kw_lifesteal',
        'badge_kw_freeze',
        'badge_kw_battlecry',
        'badge_kw_deathrattle',
        'badge_kw_spellpower',
        'badge_kw_silence',
    ]
    smart_slice(
        os.path.join(SOURCE_DIR, 'button13.png'),
        expected_count=13,
        names=kw_names,
    )

    # 阵营印章 · 5 个（顺序 蜀 魏 吴 群 中）
    faction_names = [
        'emblem_shu',
        'emblem_wei',
        'emblem_wu',
        'emblem_qun',
        'emblem_neutral',
    ]
    smart_slice(
        os.path.join(SOURCE_DIR, 'button阵营.png'),
        expected_count=5,
        names=faction_names,
    )

    print(f'\n✅ 切片完成，输出目录：{OUTPUT_DIR}')


if __name__ == '__main__':
    main()

"""Translate public interface keys on the runner using an offline OPUS-MT model."""
from collections import Counter
from pathlib import Path
import json
import re

from ctranslate2 import Translator
from huggingface_hub import snapshot_download
from sentencepiece import SentencePieceProcessor


def catalog(name):
    source = Path(f"assets/locales/{name}.js").read_text(encoding="utf-8")
    return list(json.loads(source.strip().removeprefix("export default").strip().removesuffix(";")))


output = Path("qa-results")
output.mkdir(exist_ok=True)
folder = Path(snapshot_download(
    "skaldrim/opus-mt-da-en-ct2-int8",
    revision="d5fb205eb145ee1fef933d16f9c102108518261d",
    allow_patterns=["opus-mt-en-da/*"],
)) / "opus-mt-en-da"
translator = Translator(str(folder), device="cpu", compute_type="int8", intra_threads=2, inter_threads=2)
source = SentencePieceProcessor(model_file=str(folder / "source.spm"))
target = SentencePieceProcessor(model_file=str(folder / "target.spm"))

keys = list(dict.fromkeys([*catalog("sv"), *catalog("nl")]))
canonical = {key.strip().casefold(): key.strip() for key in reversed(keys) if key.strip()}
protected = re.compile(r"https?://[^\s]+|\{\d+\}|\beXpress\b|\b(?:ATA|EUR-MED|EUR1|EORI|CSV|PDF|VAT|IIC|REX)\b")


def protect(text):
    markers = {}
    def substitute(match):
        marker = str(90873100 + len(markers))
        markers[marker] = match.group()
        return marker
    return protected.sub(substitute, text), markers


def translate(segments):
    if not segments:
        return []
    tokenized = source.encode(segments, out_type=str)
    answers = translator.translate_batch(tokenized, beam_size=2, max_batch_size=768, batch_type="tokens", max_decoding_length=400)
    return target.decode([answer.hypotheses[0] for answer in answers])


unique = list(canonical.values())
translated = {}
repair = []
for start in range(0, len(unique), 192):
    batch = unique[start:start+192]
    values = [protect(message) for message in batch]
    for original, (masked, markers), result in zip(batch, values, translate([value[0] for value in values])):
        if not result or any(result.count(marker) != 1 for marker in markers):
            repair.append(original)
            continue
        for marker, value in markers.items():
            result = result.replace(marker, value)
        if Counter(re.findall(r"\{\d+\}", original)) != Counter(re.findall(r"\{\d+\}", result)):
            repair.append(original)
        else:
            translated[original.casefold()] = result
    print(f"Processed {min(start+192,len(unique))} of {len(unique)} interface keys", flush=True)

fragments = set()
for message in repair:
    fragments.update(part.strip() for part in re.split(f"({protected.pattern})",message)
                     if part.strip() and not protected.fullmatch(part))
parts = sorted(fragments)
part_words = dict(zip(parts, translate(parts)))
for message in repair:
    def render(part):
        word = part.strip()
        if not word or protected.fullmatch(part):
            return part
        return part.replace(word,part_words[word] or word,1)
    translated[message.casefold()] = "".join(render(part) for part in re.split(f"({protected.pattern})",message)) or message

words = {}
for key in keys:
    stripped = key.strip()
    value = translated.get(stripped.casefold(),stripped)
    if value and stripped and stripped[0].islower():
        value = value[0].lower() + value[1:]
    words[key] = key.replace(stripped,value,1) if stripped else key

assert len(words)==len(keys)
assert all(Counter(re.findall(r"\{\d+\}",key))==Counter(re.findall(r"\{\d+\}",value)) for key,value in words.items())
(output / "da.json").write_text(json.dumps(words,ensure_ascii=False),encoding="utf-8")
print(f"{len(keys)} keys, {len(unique)} unique strings, {len(repair)} protected strings repaired.")

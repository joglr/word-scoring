import * as fs from "fs";
import * as path from "path";
import * as pdf from "pdf-extraction";

process.stdin.on("data", main);

async function main(buffer: Buffer) {
  const inData = buffer.toString("utf-8");
  const lines = inData
    .split("\n")
    .map((p) => p.trim())
    .filter((n) => n.length > 0);

  const contents = await Promise.all(
    lines.map(async (fileName) => {
      const pathname = path.resolve(__dirname, fileName);
      return await extractTextFromPdf(pathname);
    })
  );

  processText(contents.join("\n"));
}

async function extractTextFromPdf(pdfPath: string) {
  let dataBuffer = fs.readFileSync(pdfPath);

  let stuff = "";

  await pdf(dataBuffer).then(function (data: { text: string }) {
    stuff += data.text;
  });

  return stuff;
}

const commonNonWords = ".,:;’/–-()0123456789".split("");

function processText(text: string) {
  const wordsMap = new Map();
  const matches = text.match(/\b(\S+?)\b/gim).filter(
    (m) => !commonNonWords.includes(m)
    //  && m.length > 1
  );

  matches.map((match) => {
    const key = match.toLowerCase();
    const value = wordsMap.get(match.toLowerCase());
    if (value) {
      wordsMap.set(key, value + 1);
    } else {
      wordsMap.set(key, 1);
    }
  });

  const wordExcludeList = `the
and
for
that
are
can
with
this
which
from
not
use
all
also
one
more
have
each
such
key
other
used
will
between
should
set
when
these
new
user
number`.split("\n");

  Array.from(wordsMap.entries())

    // .filter(([word]) =>
    // !wordExcludeList.includes(word) && word.length > 2
    // )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .forEach(([word, count]) => {
      console.log(
        `${count}: ${word} (${((count / matches.length) * 100).toFixed(2)}%)`
      );
    });
}

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';
import { IDefaultConfig } from './interfaces';
import { HashTypes, IFilePaths } from './types';

const getInputPath = async (rl: readline.Interface): Promise<string> => {
  return new Promise((resolve) => {
    checkInputPath(rl, resolve);
  });
};

const checkInputPath = async (
  rl: readline.Interface,
  resolve: (value: string | PromiseLike<string>) => void
) => {
  rl.question(
    chalk.white('Enter the input file (RELATIVE PATH) like:\n') +
      chalk.grey(
        './input/en-custom.json (the extension name from the file is optional but the file needs to be a .json).\n'
      ),
    async (inputPath: string) => {
      while (!inputPath) {
        console.error(chalk.red('The file path is required.\n'));
        inputPath = await getInputPath(rl);
      }
      if (!inputPath.endsWith('.json')) {
        inputPath = inputPath + '.json';
      }
      fs.access(
        path.join(process.cwd(), inputPath),
        fs.constants.F_OK,
        async (err) => {
          if (err) {
            console.error(chalk.red(`The file ${inputPath} does not exist.\n`));
            inputPath = await getInputPath(rl);
            return;
          }
          resolve(inputPath);
        }
      );
    }
  );
};

const getOutputPath = (rl: readline.Interface): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(
      chalk.white('Enter the output file relative path like:\n') +
        chalk.grey('./output/en-custom.(ts/js) (the extension is required).\n'),
      (outputPath: string) => {
        const dir = path.dirname(path.join(process.cwd(), outputPath));
        if (!fs.existsSync(dir)) {
          console.error(chalk.red(`The directory ${dir} does not exist \n`));
          return getOutputPath(rl);
        }
        resolve(outputPath);
      }
    );
  });
};

const getHeaderDescription = (rl: readline.Interface): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(
      chalk.yellow(
        'Enter the header description (optional) (Default is: "This file is auto-generated. Do not edit."): \n'
      ),
      (headerDescription: string) => {
        if (headerDescription === '') {
          headerDescription = 'This file is auto-generated. Do not edit.';
        }
        resolve(headerDescription);
      }
    );
  });
};

const getchosenLanguagePath = (
  rl: readline.Interface,
  filePaths: IFilePaths[]
): Promise<string> => {
  return new Promise((resolve) => {
    console.log('Please select the desired language from the list below:\n');
    for (let i = 0; i < filePaths.length; i++) {
      console.log(`${i + 1}) ${filePaths[i].outputPath}`);
    }
    rl.question(
      chalk.yellow('\nEnter the number of the option: \n'),
      (option: string) => {
        const index = parseInt(option, 10) - 1;
        if (index >= 0 && index < filePaths.length) {
          resolve(filePaths[index].outputPath);
        } else {
          console.error(chalk.red('Invalid option selected.\n'));
          getchosenLanguagePath(rl, filePaths).then((chosenLang) => {
            const fileName = chosenLang
              .split('/')
              .pop()
              ?.replace('.ts', '')
              .replace('.js', '');
            resolve(String(fileName));
          });
        }
      }
    );
  });
};

const getPrettyOutput = (rl: readline.Interface): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(
      chalk.yellow('Do you want pretty-printed output? (y/N): \n'),
      (prettyOutput: string) => {
        resolve(prettyOutput);
      }
    );
  });
};

const getHashType = (rl: readline.Interface): Promise<HashTypes> => {
  return new Promise((resolve) => {
    let hashType: HashTypes = 'md5';
    console.log('Select the hash type: ');
    console.log(chalk.white('1)') + ' ' + chalk.green('md5 (default)'));
    console.log('2) sha1');
    console.log('3) sha256');
    rl.question(
      chalk.yellow('Enter the number of the option: \n'),
      (option: string) => {
        if (option === '2') {
          hashType = 'sha1';
        } else if (option === '3') {
          hashType = 'sha256';
        }
        resolve(hashType);
      }
    );
  });
};

const getUserEntries = async (
  rl: readline.Interface
): Promise<IDefaultConfig> => {
  const filePaths: IFilePaths[] = [];
  let keepAdding = true;

  const askForMore = (): Promise<void> => {
    return new Promise((resolve) => {
      rl.question(
        chalk.yellow('Do you want to add more input/output paths? (y/n)\n'),
        (answer: string) => {
          keepAdding = answer === 'y';
          resolve();
        }
      );
    });
  };

  const isPathAlreadySent = (inputPath: string, outputPath: string) => {
    return filePaths.some(
      (filePath) =>
        filePath.inputPath === inputPath && filePath.outputPath === outputPath
    );
  };

  while (keepAdding) {
    const inputPath = await getInputPath(rl);
    const outputPath = await getOutputPath(rl);
    const pathExists = isPathAlreadySent(inputPath, outputPath);
    if (pathExists) {
      console.log(chalk.red('This input/output path was already set!\n'));
    } else {
      filePaths.push({ inputPath, outputPath });
      await askForMore();
    }
  }
  const chosenLanguagePath = await getchosenLanguagePath(rl, filePaths);

  const headerDescription = await getHeaderDescription(rl);
  const hashType = await getHashType(rl);
  const prettyOutput = (await getPrettyOutput(rl)) === 'y' ? true : false;

  return {
    headerDescription,
    hashType,
    prettyOutput,
    filePaths,
    chosenLanguagePath,
  };
};
export { getUserEntries };

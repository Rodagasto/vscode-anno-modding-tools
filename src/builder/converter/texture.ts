import * as fs from 'fs';
import * as path from 'path';
import { Converter } from '../Converter';

import * as dds from '../../other/dds';
import * as utils from '../../other/utils';

export class TextureConverter extends Converter {
  public getName() {
    return 'texture';
  }

  public async run(files: string[], sourceFolder: string, outFolder: string, options: {
    cache: string,
    ci: string,
    converterOptions: any
  }) {
    for (const file of files) {
      this._logger.log(`  => ${file}`);
      const lodLevels = Math.max(0, Math.min(9, options.converterOptions.lods === undefined ? 3 : options.converterOptions.lods));
      const changePath = options.converterOptions.changePath || '';
      const maskEnding = options.converterOptions.maskEnding || '_mask.png';
      const sourceFile = path.join(sourceFolder, file);

      try {
        const dirname = path.dirname(file);
        const basename = path.basename(file, '.png');

        utils.ensureDir(path.join(outFolder, dirname, changePath));
        utils.ensureDir(path.join(options.cache, dirname));

        const lodFilePaths = [];
        if (lodLevels === 0) {
          // lods disabled, don't change file name
          lodFilePaths.push(path.join(outFolder, dirname, changePath, basename + '.dds'));
        }
        else {
          for (let lodLevel = 0; lodLevel < lodLevels; lodLevel++) {
            lodFilePaths.push(path.join(outFolder, dirname, changePath, basename + '_' + lodLevel + '.dds'));
          }
        }

        const targetFolder = path.dirname(lodFilePaths[0]);
        const textures = dds.convertToTexture(sourceFile, targetFolder, dds.TextureFormat.unknown, lodLevels);
        if (!textures) {
          return false;
        }
        for (var [index, texture] of textures.entries()) {
          this._logger.log(`  <= ${lodLevels ? `LOD ${index}: ` : ''}${path.relative(path.dirname(file), path.relative(outFolder, path.join(targetFolder, texture)))}`);
        }
      }
      catch (exception: any)
      {
        this._logger.error(exception.message);
        return false;
      }
    }
    return true;
  }
}

import * as core from '@actions/core';
import { run } from './main';

run().catch(error => {
  core.setFailed(error.message);
});
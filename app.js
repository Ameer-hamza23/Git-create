#!/usr/bin/env node

import {program} from "commander";
import { initRepo,addFile,commitChanges, showLogs, showStatus, checkout, status } from "./git.js";

program
  .command('init')
  .description('Initialize a new MyGit repository')
  .action(initRepo);

program
.command('add <filename>')
.description('Add a file to the staging area')
.action(addFile)

program
  .command('commit')
  .description('Commit staged changes with a message')
  .requiredOption('-m, --message <message>', 'Commit message')
  .action((options) => {
    commitChanges(options.message);
  });
  program
  .command('log')
  .description('Show commit history')
  .action(showLogs);
//   program
//   .command('status')
//   .description('Show the current status of your repo')
//   .action(showStatus);

  program
  .command('checkout <commitId>')
  .description('Restore your project to a specific commit')
  .action(checkout);
  program
  .command('status')
  .description('Show the status of the working directory')
  .action(() => {
    status();
  });

program.parse(process.argv);


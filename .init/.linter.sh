#!/bin/bash
cd /home/kavia/workspace/code-generation/asteroid-dodge-game-172091-172100/asteroid_dodger_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


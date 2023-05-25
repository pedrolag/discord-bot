import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

const CALL_FOR_VEHICLE_OWNER_COMMAND = {
  name: 'call',
  description: 'Call for the owner of the given vehicle\'s plate',
  type: 1,
  options: [
    {
      type: 3,
      name: 'plate',
      description: 'Vehicle\'s plate',
      required: true,
    }
  ]
};

const ALL_COMMANDS = [
  CALL_FOR_VEHICLE_OWNER_COMMAND
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
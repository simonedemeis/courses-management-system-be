import pino from "pino";

const today = new Date();

const logFileName = `${today.getUTCDate()}-${today.getUTCMonth() + 1}-${today.getUTCFullYear()}` 

export const logger = pino.pino(
  {
    transport: {
      targets: [
        {
          target: "pino-pretty",
        },
        {
          target: "pino/file",
          options: {
            destination: `logs/${logFileName}.log`,
          }
        },
      ],
      options: {
        colorize: true,
      },
    },
  }
);

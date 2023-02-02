declare module 'testcafe-reporter-acd-html-reporter/lib/Logger' {
    export class Logger {
            static step(stepNum: number | number[], message: string): void;
        
            static info(message: string): void;
            
            static preconditions(): void;
            
            static cleanUp(): void;
            
            static warn(message: string): void;
    }            
}

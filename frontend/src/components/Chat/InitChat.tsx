import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";

interface InitChatProps {
  handleStartChat: (prompt?: string) => void;
  starterPrompts: string[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputMessage: string;
}

export default function InitChat({ handleStartChat, starterPrompts, handleInputChange, inputMessage }: InitChatProps) {

  return (
    <div className="flex flex-col h-[calc(100vh-85px)] overflow-y-auto justify-center items-center">
    
       <main className="flex-grow px-4 flex flex-col w-full max-w-full sm:max-w-3xl lg:max-w-[1045px] lg:min-w-[1045px] mx-auto">
      <h3 className="text-center font-light text-sm mt-12 mb-24">Choose a prompt below or start with your own message</h3>
     
        <div className="w-full flex-grow flex flex-col justify-between py-4 md:py-8">
          
            <div className="flex flex-col items-center">
              <Image
                width={200}
                height={200}
                alt="Union Training Bot"
                src="/images/chat-bot.svg"
                className=" w-[150px] md:w-[250px]"
                priority
              />
            </div>
          
          <div className="mt-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartChat();
              }}
              className="flex flex-col sm:flex-row items-center gap-3">
              <Input
                data-testid="initiateChatInput"
                onChange={handleInputChange}
                className="w-full bg-slate-50 text-[14px] p-4 rounded-full border-none shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-0 focus:ring-0 placeholder:text-xs placeholder:px-2"
                placeholder="Start typing..."
                value={inputMessage}
              />

              <Button
                data-testid="initiateChatSendButton"
                type="submit"
                className="w-full sm:w-auto text-base py-2 px-4 rounded-full whitespace-nowrap flex items-center justify-center text-sm"
                disabled={!inputMessage}>
                Send
                <SendHorizontal className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <p className="text-left font-regular text-xs ml-2">Struggling to start?</p>

            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <Badge
                  key={uuidv4()}
                  onClick={() => handleStartChat(prompt)}
                  className="text-xs font-light rounded-full whitespace-nowrap bg-primary-light text-primary w-fit p-2 hover:bg-primary-light/80 hover:shadow-lg cursor-pointer transition-colors">
                  {prompt}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

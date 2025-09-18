
'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, User } from 'lucide-react';
import { chatAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

type Message = {
  role: 'user' | 'model';
  content: string;
};

const INITIAL_MESSAGE: Message = {
  role: 'model',
  content:
    'Hello! I am AWION, your AI assistant. How can I help you navigate the features of the DAWION application today?',
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // The `messages` state already includes the initial message.
      // We pass the conversation history (excluding the latest user message)
      // and the new message separately.
      const response = await chatAction({
        history: messages,
        message: currentInput,
      });
      const assistantMessage: Message = { role: 'model', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not get a response. Please try again.',
      });
       // Restore user message to input if sending fails
       setMessages(prev => prev.slice(0, prev.length -1));
       setInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to initial message when sheet is closed
  useEffect(() => {
    if (!isOpen) {
      setMessages([INITIAL_MESSAGE]);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-7 w-7" />
        <span className="sr-only">Open Chatbot</span>
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'><Bot /> AWION</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-4 -mr-6" ref={scrollAreaRef}>
            <div className="space-y-4 p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'model' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                        <Skeleton className="h-4 w-12" />
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter>
            <div className="relative w-full">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="pr-12"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={handleSend}
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

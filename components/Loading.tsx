import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Loading() {
    return (
        <div className={cn(
            "flex items-center justify-center min-h-screen bg-background"
        )}>
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                {/* <span className="text-lg font-semibold text-muted-foreground">
                    Loading, please wait...
                </span> */}
            </div>
        </div>
    );
}
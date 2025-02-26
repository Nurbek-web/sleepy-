import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AlertBannerProps {
  missingSleep?: boolean;
  missingTest?: boolean;
}

export function AlertBanner({ missingSleep, missingTest }: AlertBannerProps) {
  const router = useRouter();

  if (!missingSleep && !missingTest) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Action Required</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          {missingSleep && (
            <div className="flex items-center justify-between">
              <span>You haven&apos;t added your sleep entry for today.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/sleep-entry")}
              >
                Add Sleep Entry
              </Button>
            </div>
          )}
          {missingTest && (
            <div className="flex items-center justify-between">
              <span>
                You haven&apos;t taken your critical thinking test today.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/test")}
              >
                Take Test
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

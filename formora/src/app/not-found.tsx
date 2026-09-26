import StoreLayout from "./(store)/layout";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

/** Unmatched URLs: render inside the store chrome. */
export default function NotFound() {
  return (
    <StoreLayout>
      <NotFoundContent />
    </StoreLayout>
  );
}

import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@renderer/components/ui";
import { FilePlusIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@renderer/app-context";
import { toast } from "sonner";

type Props = {
  projects?: Nvmd.Project[];
  groups?: Nvmd.Group[];
  versions?: string[];
  onSubmit?: (group: Nvmd.Group) => Promise<void>;
};

export const GroupCreator: React.FC<Props> = ({
  projects: projectsProp = [],
  groups: groupsProp = [],
  versions = [],
  onSubmit: onSubmitProp
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const i18n = useI18n();

  const formSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, "group name is invalid")
          .max(16, "group name is invalid")
          .trim()
          .refine((val) => !groupsProp.find(({ name }) => name === val), {
            message: "group name already exists"
          }),
        desc: z.string(),
        version: z.string().min(1, { message: "please select a version" }),
        projects: z.array(z.string())
      }),
    [groupsProp.length]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      version: "",
      desc: "",
      projects: []
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await window.Context.onGroupCreate(values);

      await onSubmitProp?.(values);
      setOpen(false);
    } catch (err) {
      toast.error(
        err.message
          ? err.message.split("Error invoking remote method 'group-create': ").slice(-1)
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset({ name: "", version: "", desc: "", projects: [] });
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-sm" icon={<FilePlusIcon />}>
          {i18n("Create-Group")}
        </Button>
      </DialogTrigger>
      <DialogContent className="top-1/3" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{i18n("Create-Group")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-muted-foreground">{i18n("Group-Name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="name" {...field} />
                  </FormControl>
                  <FormMessage className="absolute -translate-y-2" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desc"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-muted-foreground">{i18n("Group-Desc")}</FormLabel>
                  <FormControl>
                    <Input placeholder="description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-muted-foreground">{i18n("Version")}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="language-trigger">
                          <SelectValue data-testid="language-value" placeholder="version" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version} value={version}>
                            v{version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="absolute -translate-y-2" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projects"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-muted-foreground">{i18n("Projects")}</FormLabel>
                  <FormControl>
                    <MultiSelect onValueChange={field.onChange} defaultValue={field.value}>
                      <MultiSelectTrigger>
                        <MultiSelectValue maxDisplay={2} maxItemLength={5} placeholder="projects" />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        <MultiSelectSearch
                          icon={<MagnifyingGlassIcon />}
                          placeholder={i18n("Input-To-Search")}
                        />
                        <MultiSelectList>
                          {projectsProp.map(({ name, path }) => (
                            <MultiSelectItem key={path} value={path}>
                              {name}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectList>
                      </MultiSelectContent>
                    </MultiSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={loading} variant="secondary">
              {i18n("Cancel")}
            </Button>
          </DialogClose>
          <Button loading={loading} onClick={form.handleSubmit(onSubmit)}>
            {i18n("OK")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

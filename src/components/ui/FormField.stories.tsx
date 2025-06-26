import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Box } from "@mui/material";
import FormField, { SelectOption } from "./FormField";

const selectOptions: SelectOption[] = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

const FormFieldWrapper = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ width: 300, p: 2 }}>{children}</Box>
);

const meta = {
  title: "Components/FormField",
  component: FormField,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Versatile form field component supporting text, select, checkbox, slider, and file input types.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <FormFieldWrapper>
        <Story />
      </FormFieldWrapper>
    ),
  ],
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["text", "select", "checkbox", "slider", "file"],
      description: "Type of form field",
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium"],
      description: "Size of the field",
    },
    variant: {
      control: { type: "select" },
      options: ["outlined", "filled", "standard"],
      description: "Visual variant of the field",
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextField: Story = {
  args: {
    type: "text",
    label: "Username",
    placeholder: "Enter your username",
  },
};

export const TextFieldError: Story = {
  args: {
    type: "text",
    label: "Email",
    value: "invalid-email",
    error: true,
    helperText: "Please enter a valid email address",
  },
};

export const MultilineText: Story = {
  args: {
    type: "text",
    label: "Description",
    multiline: true,
    rows: 4,
    placeholder: "Enter description...",
  },
};

export const SelectField: Story = {
  args: {
    type: "select",
    label: "Category",
    options: selectOptions,
  },
};

export const CheckboxField: Story = {
  args: {
    type: "checkbox",
    label: "Accept Terms and Conditions",
  },
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <FormField
        type="checkbox"
        label="Accept Terms and Conditions"
        checkboxProps={{
          checked,
          onChange: (e) => setChecked(e.target.checked),
        }}
      />
    );
  },
};

export const SliderField: Story = {
  args: {
    type: "slider",
    label: "Volume",
  },
  render: () => {
    const [value, setValue] = useState(50);
    return (
      <FormField
        type="slider"
        label="Volume"
        value={value}
        onChange={(newValue) => setValue(newValue as number)}
        sliderProps={{
          min: 0,
          max: 100,
          step: 10,
          marks: true,
          valueLabelDisplay: "auto",
        }}
      />
    );
  },
};

export const FileField: Story = {
  args: {
    type: "file",
    label: "Upload File",
  },
  render: () => {
    const [fileName, setFileName] = useState<string>("");
    return (
      <FormField
        type="file"
        label="Upload File"
        onChange={(file) => {
          if (file instanceof File) {
            setFileName(file.name);
          }
        }}
        fileProps={{
          accept: ".jpg,.png,.pdf",
          fileName,
        }}
      />
    );
  },
};

export const SmallSize: Story = {
  args: {
    type: "text",
    label: "Small Field",
    size: "small",
  },
};

export const DisabledField: Story = {
  args: {
    type: "text",
    label: "Disabled Field",
    value: "Cannot edit this",
    disabled: true,
  },
};

export const RequiredField: Story = {
  args: {
    type: "text",
    label: "Required Field",
    required: true,
    helperText: "This field is required",
  },
};

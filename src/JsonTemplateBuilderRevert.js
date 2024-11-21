import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

const FormattingToolbar = ({ onFormatText, activeTextarea }) => {
  const insertTag = (tag) => {
    if (!activeTextarea) return;

    const start = activeTextarea.selectionStart;
    const end = activeTextarea.selectionEnd;
    const text = activeTextarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    const newValue = `${before}<${tag}>${selection}</${tag}>${after}`;

    onFormatText(newValue);

    setTimeout(() => {
      activeTextarea.focus();
      activeTextarea.setSelectionRange(
        start + tag.length + 2,
        end + tag.length + 2
      );
    }, 0);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-50">
      <div className="max-w-7xl mx-auto flex space-x-2">
        <button
          onClick={() => insertTag('h1')}
          className="p-1 text-blue-500 hover:text-blue-700"
          disabled={!activeTextarea}
        >
          <span className="text-lg font-bold">H1</span>
        </button>
        <button
          onClick={() => insertTag('strong')}
          className="p-1 text-blue-500 hover:text-blue-700"
          disabled={!activeTextarea}
        >
          <span className="font-bold">B</span>
        </button>
      </div>
    </div>
  );
};

const AddElementSidebar = ({ addElement }) => {
  return (
    <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Add Elements</h2>
      <button
        onClick={() => addElement('p')}
        className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700"
      >
        Add Paragraph
      </button>
      <button
        onClick={() => addElement('ol')}
        className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700"
      >
        Add Ordered List
      </button>
      <button
        onClick={() => addElement('ul')}
        className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700"
      >
        Add Unordered List
      </button>
    </div>
  );
};

const FormattedInput = ({ value, onChange, onFocus }) => {
  const textareaRef = useRef(null);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => onFocus(textareaRef.current)}
      className="w-full p-2 border rounded"
    />
  );
};

const Element = ({ element, index, updateElement, removeElement }) => {
  return (
    <Draggable draggableId={element.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="mb-6 p-6 border rounded-lg bg-white shadow-sm"
        >
          <div className="flex justify-between items-center mb-4" {...provided.dragHandleProps}>
            <h3 className="text-lg font-semibold">Element {index + 1}</h3>
            <button onClick={() => removeElement(element.id)} className="text-red-500">Remove</button>
          </div>
          <FormattedInput
            value={element.content}
            onChange={(value) => updateElement(element.id, { content: value })}
          />
        </div>
      )}
    </Draggable>
  );
};

const convertToUpdatedJsonSchema = (elements) => ({
  schema: {
    description:
      "Ensure that only the required data fields specified in the template are generated, strictly adhering to the provided element structure.",
    properties: {
      tag: { enum: ["body"] },
      content: null,
      children: elements.map((element, index) => {
        const groupId = `group${index + 1}`;
        const firstFieldAttributes = [
          {
            properties: {
              name: { enum: ["data-related-id"] },
              value: { enum: [groupId] },
            },
          },
        ];
        const otherFieldAttributes = [
          {
            properties: {
              name: { enum: ["id"] },
              value: { enum: [groupId] },
            },
          },
        ];

        return {
          properties: {
            tag: { enum: [element.type] },
            attributes: index === 0 ? firstFieldAttributes : otherFieldAttributes,
            content: element.content ? { enum: [element.content] } : null,
            children: null,
          },
        };
      }),
    },
  },
});

const JsonTemplateBuilder = () => {
  const [elements, setElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState(null);
  const [activeTextarea, setActiveTextarea] = useState(null);

  useEffect(() => {
    setJsonSchema(convertToUpdatedJsonSchema(elements));
  }, [elements]);

  const handleTextareaFocus = (textarea) => {
    setActiveTextarea(textarea);
  };

  const addElement = (type) => {
    setElements((prev) => [
      ...prev,
      { id: uuidv4(), type, content: '' },
    ]);
  };

  const updateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const removeElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">JSON Template Builder</h1>
        <div className="flex">
          <AddElementSidebar addElement={addElement} />
          <div className="flex-1">
            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) return;
                const reordered = Array.from(elements);
                const [moved] = reordered.splice(result.source.index, 1);
                reordered.splice(result.destination.index, 0, moved);
                setElements(reordered);
              }}
            >
              <Droppable droppableId="elements">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {elements.map((element, index) => (
                      <Element
                        key={element.id}
                        element={element}
                        index={index}
                        updateElement={updateElement}
                        removeElement={removeElement}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Generated JSON Schema</h2>
          <pre className="bg-white p-4 rounded border">{JSON.stringify(jsonSchema, null, 2)}</pre>
        </div>
      </div>
      <FormattingToolbar
        onFormatText={(value) =>
          setElements((prev) =>
            prev.map((el) =>
              el.id === activeTextarea?.dataset.elementId
                ? { ...el, content: value }
                : el
            )
          )
        }
        activeTextarea={activeTextarea}
      />
    </div>
  );
};

export default JsonTemplateBuilder;

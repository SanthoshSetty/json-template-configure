import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon, MenuIcon } from '@heroicons/react/solid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

// Utility function for mapping HTML tag types to readable names.
const getElementTypeName = (type) => {
  const typeNames = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: 'Paragraph',
    ul: 'Unordered List (Bullet Points)',
    ol: 'Ordered List (Numbered List)',
    span: 'Span (Continuous Text)',
    strong: 'Strong (Bold Text)',
    br: 'Line Break',
  };
  return typeNames[type] || type.toUpperCase();
};

const ElementTypes = {
  HEADING1: 'h1',
  HEADING2: 'h2',
  HEADING3: 'h3',
  PARAGRAPH: 'p',
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  SPAN: 'span',
  STRONG: 'strong',
  BREAK: 'br',
};

const defaultContent = {
  ul: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  ol: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  br: '',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  p: 'Paragraph text',
  strong: 'Bold text',
  span: 'Span text',
};

// Sidebar component for adding elements
const AddElementSidebar = ({ addElement, groups }) => (
  <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Add Elements</h2>
    {Object.entries(ElementTypes).map(([key, value]) => (
      <div key={key} className="mb-4">
        <span className="font-semibold text-gray-600">{key.replace(/_/g, ' ')}</span>
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => addElement(value, group.id)}
            className="block w-full text-left text-blue-500 hover:text-blue-700 transition-colors duration-200"
          >
            Add to {group.name}
          </button>
        ))}
      </div>
    ))}
  </div>
);

// Group management component
const GroupSidebar = ({ groups, addGroup, renameGroup, deleteGroup }) => (
  <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">Groups</h2>
    {groups.map((group) => (
      <div key={group.id} className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">{group.name}</span>
          <div className="flex space-x-2">
            <button onClick={() => renameGroup(group.id)} className="text-blue-500 hover:text-blue-700">
              Rename
            </button>
            <button onClick={() => deleteGroup(group.id)} className="text-red-500 hover:text-red-700">
              Delete
            </button>
          </div>
        </div>
      </div>
    ))}
    <button onClick={addGroup} className="text-green-500 hover:text-green-700">
      + Add Group
    </button>
  </div>
);

// Main Component
const JsonTemplateBuilderWithGroups = () => {
  const [groups, setGroups] = useState([{ id: uuidv4(), name: 'Default Group', elements: [] }]);
  const [jsonSchema, setJsonSchema] = useState('{}');

  // Add new element to a specific group
  const addElement = (type, groupId) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              elements: [
                ...group.elements,
                {
                  id: uuidv4(),
                  type,
                  content: defaultContent[type] || 'New element',
                  description: null,
                },
              ],
            }
          : group
      )
    );
  };

  // Remove an element from a group
  const removeElement = (groupId, elementId) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId
          ? { ...group, elements: group.elements.filter((el) => el.id !== elementId) }
          : group
      )
    );
  };

  // Add a new group
  const addGroup = () => {
    const newGroup = {
      id: uuidv4(),
      name: `Group ${groups.length + 1}`,
      elements: [],
    };
    setGroups((prevGroups) => [...prevGroups, newGroup]);
  };

  // Rename a group
  const renameGroup = (groupId) => {
    const newName = prompt('Enter new group name:');
    if (newName) {
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group.id === groupId ? { ...group, name: newName } : group
        )
      );
    }
  };

  // Delete a group
  const deleteGroup = (groupId) => {
    setGroups((prevGroups) => prevGroups.filter((group) => group.id !== groupId));
  };

  // Update JSON schema whenever groups or elements change
  useEffect(() => {
    setJsonSchema(
      JSON.stringify(
        {
          groups: groups.map((group) => ({
            name: group.name,
            elements: group.elements.map((element) => ({
              type: element.type,
              content: element.content,
              description: element.description,
            })),
          })),
        },
        null,
        2
      )
    );
  }, [groups]);

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder with Groups</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <GroupSidebar
            groups={groups}
            addGroup={addGroup}
            renameGroup={renameGroup}
            deleteGroup={deleteGroup}
          />
          <AddElementSidebar addElement={addElement} groups={groups} />
          <div className="flex-1 bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
              Grouped Elements
            </h2>
            {groups.map((group) => (
              <div key={group.id} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">{group.name}</h3>
                {group.elements.length === 0 ? (
                  <p className="text-gray-500 italic">No elements in this group.</p>
                ) : (
                  group.elements.map((element) => (
                    <div
                      key={element.id}
                      className="mb-4 p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <span>{getElementTypeName(element.type)}</span>
                        <button
                          onClick={() => removeElement(group.id, element.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-gray-600 mt-2">{element.content}</p>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
          <div className="w-full md:w-64">
            <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
              JSON Schema
            </h2>
            <textarea
              value={jsonSchema}
              readOnly
              className="w-full h-[300px] p-2 font-mono text-sm border rounded focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonTemplateBuilderWithGroups;

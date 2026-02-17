import React, { useState } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux'
import UpdateProblem from '../components/UpdateProblem';
import DeleteProblem from '../components/DeleteProblem';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('create');
    // Add state for the code section toggle
    const [codeTab, setCodeTab] = useState('startCode');
    // Add loading state
    const [isLoading, setIsLoading] = useState(false);
    // Add status message state
    const [statusMessage, setStatusMessage] = useState(null);
    
    const { user } = useSelector((state) => state.auth)

    // Mock data for the 'view' tab
    const [myProblems] = useState([
        { id: 1, title: 'Two Sum', difficulty: 'easy', status: 'Published', submissions: 1240 },
        { id: 2, title: 'Median of Two Sorted Arrays', difficulty: 'hard', status: 'Draft', submissions: 56 },
        { id: 3, title: 'Longest Palindromic Substring', difficulty: 'medium', status: 'Published', submissions: 890 },
    ]);

    // ... zod schema validation ...
    const validateProblemData = z.object({
        title: z.string().min(1, "Title is required").trim(),
        description: z.string().min(10, "Description must be at least 10 characters").trim(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        tags: z.array(z.string()),
        visibleTestCases: z.array(z.object({
            input: z.string().min(1, "Input is required"),
            output: z.string().min(1, "Output is required"),
            explanation: z.string().min(1, "Explanation is required")
        })),
        hiddenTestCases: z.array(z.object({
            input: z.string().min(1, "Input is required"),
            output: z.string().min(1, "Output is required")
        })),
        startCode: z.array(z.object({
            language: z.string().min(1, "Language is required"),
            initialCode: z.string().min(1, "Initial code is required")
        })),
        referenceSolution: z.array(z.object({
            language: z.string().min(1, "Language is required"),
            completeCode: z.string().min(1, "Complete code is required")
        })),
    });

    const { register, control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
        resolver: zodResolver(validateProblemData),
        defaultValues: {
            title: '',
            description: '',
            difficulty: 'easy',
            tags: [],
            visibleTestCases: [{ input: '', output: '', explanation: '' }],
            hiddenTestCases: [{ input: '', output: '' }],
            startCode: [{ language: 'java', initialCode: '' }],
            referenceSolution: [{ language: 'java', completeCode: '' }]
        }
    });

    const handleDiscard = () => {
        if (window.confirm("Are you sure you want to discard your changes?")) {
            reset();
            setTagInput("");
            toast.success("Changes discarded");
            setActiveTab('view');
        }
    };

    // ... field arrays hooks ...

    const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({
        control,
        name: "visibleTestCases"
    });

    const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({
        control,
        name: "hiddenTestCases"
    });

    const { fields: startCodeFields, append: appendStartCode, remove: removeStartCode } = useFieldArray({
        control,
        name: "startCode"
    });

    const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
        control,
        name: "referenceSolution"
    });

    const [tagInput, setTagInput] = useState("");

    const onSubmit = async (data) => {
        setIsLoading(true);
        setStatusMessage("Saving problem to database...");
        const loadingToast = toast.loading('Saving problem...');
        
        // --- FIX START: Handle pending tags ---
        // Create a copy of the existing tags
        let finalTags = [...(data.tags || [])];

        // If there is text in the input box that hasn't been added yet, add it now
        if (tagInput && tagInput.trim()) {
            const pendingTag = tagInput.trim();
            // Avoid duplicates
            if (!finalTags.includes(pendingTag)) {
                finalTags.push(pendingTag);
            }
        }

        // Create the final payload with the corrected tags
        const payload = {
            ...data,
            tags: finalTags
        };
        // --- FIX END ---

        try {
            // Send 'payload' instead of 'data'
            const response = await axiosClient.post('/problem/create', payload);
            
            // Check for success property or if status is 201/200
            if (response.data.success || response.status === 201 || response.status === 200) {
                toast.dismiss(loadingToast);
                const successMsg = response.data.message || 'Problem created successfully!';
                toast.success(successMsg);
                setStatusMessage(`Success: ${successMsg}`);
                
                // Clear the input and form
                setTagInput("");
                reset();

                // Optional: clear message after a delay or just switch tabs immediately
                setTimeout(() => {
                    setActiveTab('view');
                    setStatusMessage(null);
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            toast.error(`Unsuccessful to save: ${errorMessage}`);
            setStatusMessage(`Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    // ... handleAddTag and removeTag ...
    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const currentTags = watch('tags') || [];
            if (!currentTags.includes(tagInput.trim())) {
                setValue('tags', [...currentTags, tagInput.trim()], { shouldDirty: true, shouldValidate: true });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        const currentTags = watch('tags') || [];
        setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true, shouldValidate: true });
    };


    return (
        <div className="min-h-screen bg-[#051518] text-slate-200 font-sans custom-scroll overflow-y-auto">
            <Navbar />

            <div className="pt-8 pb-32 px-6 max-w-7xl mx-auto flex gap-10">
                <aside className="w-64 flex-shrink-0 sticky top-20 h-fit hidden lg:block">
                     <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all font-medium text-left ${activeTab === 'create'
                                    ? 'bg-[#0dccf2]/10 text-[#0dccf2] border-[#0dccf2]/30'
                                    : 'text-slate-400 hover:bg-[#0dccf2]/5 hover:text-[#0dccf2] border-transparent'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span> Create Problem
                        </button>
                        
                        <button
                            onClick={() => setActiveTab('update')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all font-medium text-left ${activeTab === 'update'
                                    ? 'bg-[#0dccf2]/10 text-[#0dccf2] border-[#0dccf2]/30'
                                    : 'text-slate-400 hover:bg-[#0dccf2]/5 hover:text-[#0dccf2] border-transparent'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">edit_note</span> Update Problem
                        </button>

                        <button
                            onClick={() => setActiveTab('delete')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all font-medium text-left ${activeTab === 'delete'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                    : 'text-slate-400 hover:bg-red-500/5 hover:text-red-500 border-transparent'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">delete_forever</span> Delete Problem
                        </button>

                        {activeTab === 'create' && (
                            <>
                                <div className="h-px bg-[#0dccf2]/10 my-4"></div>
                                <div className="p-4 rounded-xl bg-black/30 border border-[#0dccf2]/10 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#0dccf2] text-sm">admin_panel_settings</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created By</span>
                                    </div>
                                    <p className="text-sm font-medium text-[#0dccf2] truncate">{user?.name || user?.email || 'Admin'}</p>
                                    <div className="h-px bg-[#0dccf2]/10"></div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#0dccf2] text-sm">schedule</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</span>
                                    </div>
                                    <p className="text-xs font-mono text-slate-400">{new Date().toLocaleString()}</p>
                                </div>
                            </>
                        )}
                    </div>
                </aside>
                
                {/* Main Content */}
                <main className="flex-grow space-y-10">
                    {/* ... form implementation continues ... */}
                    {activeTab === 'create' ? (
                        <form onSubmit={handleSubmit(onSubmit)}>
                             {/* ... Basic Schema Section ... */}
                            <section className="glass-panel p-8 rounded-2xl space-y-8 mb-8" id="basic-schema">
                                <div className="flex items-center gap-3 border-b border-[#0dccf2]/10 pb-4">
                                    <span className="material-symbols-outlined text-[#0dccf2]">subject</span>
                                    <h2 className="text-xl font-bold tracking-wide">CORE SPECIFICATIONS</h2>
                                </div>
                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Problem Title (String)</label>
                                        <input 
                                            {...register("title")}
                                            className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-1 focus:ring-[#0dccf2] glow-border transition-all text-slate-200 placeholder:text-slate-600" placeholder="Enter problem title..." type="text" 
                                        />
                                        {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Problem Description (Rich Text)</label>
                                            <span className="text-[10px] text-[#0dccf2]/60 italic font-mono">minLength: 10 validation</span>
                                        </div>
                                        <div className="rounded-xl border border-[#0dccf2]/20 bg-black/40 overflow-hidden">
                                            <textarea 
                                                {...register("description")}
                                                className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-slate-300 custom-scroll outline-none" 
                                                placeholder="Enter detailed problem description..." 
                                                rows={8}
                                            ></textarea>
                                        </div>
                                        {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Difficulty</label>
                                            <select 
                                                {...register("difficulty")}
                                                className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0dccf2] glow-border transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                            {errors.difficulty && <span className="text-red-500 text-xs">{errors.difficulty.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tags (Array)</label>
                                            <div className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl px-4 py-2 flex flex-wrap gap-2 items-center min-h-[50px] focus-within:ring-1 focus-within:ring-[#0dccf2] glow-border transition-all">
                                                {watch("tags")?.map((tag, index) => (
                                                    <span key={index} className="bg-[#0dccf2]/10 text-[#0dccf2] border border-[#0dccf2]/30 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-2">
                                                        {tag} 
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeTag(tag)}
                                                            className="hover:text-white"
                                                        >
                                                            <span className="material-icons-round text-sm">close</span>
                                                        </button>
                                                    </span>
                                                ))}
                                                <input 
                                                    value={tagInput}
                                                    onChange={(e) => setTagInput(e.target.value)}
                                                    onKeyDown={handleAddTag}
                                                    className="bg-transparent border-none outline-none text-sm p-0 flex-grow min-w-[120px] focus:ring-0 text-slate-200 placeholder:text-slate-600" placeholder="Add tag..." type="text" 
                                                />
                                            </div>
                                            {errors.tags && <span className="text-red-500 text-xs">{errors.tags.message}</span>}
                                        </div>
                                    </div>
                                </div>
                            </section>
                            
                            {/* ... Test Case Engine Section ... */}
                            <section className="glass-panel p-8 rounded-2xl space-y-8 mb-8" id="test-case-engine">
                                  <div className="flex items-center justify-between border-b border-[#0dccf2]/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#0dccf2]">labs</span>
                                        <h2 className="text-xl font-bold tracking-wide uppercase">Test Case Engine</h2>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                                        className="bg-[#0dccf2]/10 text-[#0dccf2] border border-[#0dccf2]/30 hover:bg-[#0dccf2]/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                                    >
                                        <span className="material-icons-round text-sm">add</span> ADD TEST CASE
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#0dccf2] flex items-center gap-2 tracking-widest uppercase">
                                        <span className="w-2 h-2 rounded-full bg-[#0dccf2] shadow-[0_0_8px_#0dccf2]"></span>
                                        Visible Test Cases
                                    </h3>
                                    <div className="grid gap-4">
                                        {visibleFields.map((field, index) => (
                                            <div key={field.id} className="p-6 rounded-xl bg-black/30 border border-[#0dccf2]/10 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase">Case #{index + 1}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeVisible(index)}
                                                        className="text-slate-500 hover:text-[#0dccf2] transition-all"
                                                    >
                                                        <span className="material-icons-round text-sm">delete</span>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Input</label>
                                                        <textarea 
                                                            {...register(`visibleTestCases.${index}.input`)}
                                                            className="w-full bg-black/40 border border-[#0dccf2]/10 rounded-lg px-3 py-2 text-sm font-mono text-[#0dccf2] focus:ring-[#0dccf2] focus:border-[#0dccf2] transition-all outline-none" rows={2}
                                                        ></textarea>
                                                        {errors.visibleTestCases?.[index]?.input && <span className="text-red-500 text-xs">{errors.visibleTestCases[index].input.message}</span>}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Output</label>
                                                        <textarea 
                                                            {...register(`visibleTestCases.${index}.output`)}
                                                            className="w-full bg-black/40 border border-[#0dccf2]/10 rounded-lg px-3 py-2 text-sm font-mono text-[#0dccf2] focus:ring-[#0dccf2] focus:border-[#0dccf2] transition-all outline-none" rows={2}
                                                        ></textarea>
                                                        {errors.visibleTestCases?.[index]?.output && <span className="text-red-500 text-xs">{errors.visibleTestCases[index].output.message}</span>}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Explanation</label>
                                                    <input 
                                                        {...register(`visibleTestCases.${index}.explanation`)}
                                                        className="w-full bg-black/40 border border-[#0dccf2]/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:ring-[#0dccf2] focus:border-[#0dccf2] transition-all outline-none" type="text"
                                                    />
                                                    {errors.visibleTestCases?.[index]?.explanation && <span className="text-red-500 text-xs">{errors.visibleTestCases[index].explanation.message}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 tracking-widest uppercase">
                                            <span className="material-symbols-outlined text-lg">visibility_off</span>
                                            Hidden Test Cases
                                        </h3>
                                        <button 
                                            type="button"
                                            onClick={() => appendHidden({ input: '', output: '' })}
                                            className="text-xs text-slate-500 hover:text-[#0dccf2]"
                                        >
                                            + Add Hidden Case
                                        </button>
                                    </div>
                                    <div className="grid gap-4">
                                        {hiddenFields.map((field, index) => (
                                            <div key={field.id} className="p-6 rounded-xl bg-black/30 border border-[#0dccf2]/10 border-dashed space-y-4">
                                                 <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase">Hidden Case #{index + 1}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeHidden(index)}
                                                        className="text-slate-500 hover:text-[#0dccf2] transition-all"
                                                    >
                                                        <span className="material-icons-round text-sm">delete</span>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Input</label>
                                                        <textarea 
                                                            {...register(`hiddenTestCases.${index}.input`)}
                                                            className="w-full bg-black/40 border border-[#0dccf2]/10 rounded-lg px-3 py-2 text-sm font-mono text-[#0dccf2] focus:ring-[#0dccf2] focus:border-[#0dccf2] transition-all outline-none" placeholder="Enter hidden input..." rows={2}
                                                        ></textarea>
                                                        {errors.hiddenTestCases?.[index]?.input && <span className="text-red-500 text-xs">{errors.hiddenTestCases[index].input.message}</span>}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Output</label>
                                                        <textarea 
                                                            {...register(`hiddenTestCases.${index}.output`)}
                                                            className="w-full bg-black/40 border border-[#0dccf2]/10 rounded-lg px-3 py-2 text-sm font-mono text-[#0dccf2] focus:ring-[#0dccf2] focus:border-[#0dccf2] transition-all outline-none" placeholder="Enter hidden output..." rows={2}
                                                        ></textarea>
                                                        {errors.hiddenTestCases?.[index]?.output && <span className="text-red-500 text-xs">{errors.hiddenTestCases[index].output.message}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="glass-panel p-8 rounded-2xl space-y-8 mb-24" id="code-architect">
                                    <div className="flex items-center gap-3 border-b border-[#0dccf2]/10 pb-4">
                                    <span className="material-symbols-outlined text-[#0dccf2]">data_object</span>
                                    <h2 className="text-xl font-bold tracking-wide uppercase">Code Architect</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex gap-1 bg-black/30 p-1 rounded-xl w-fit border border-[#0dccf2]/10">
                                        <button 
                                            type="button" 
                                            onClick={() => setCodeTab('startCode')}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                                                codeTab === 'startCode' 
                                                ? 'bg-[#0dccf2] text-[#051518] shadow-[0_0_15px_rgba(13,204,242,0.3)]' 
                                                : 'text-slate-400 hover:text-[#0dccf2]'
                                            }`}
                                        >
                                            START CODE
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setCodeTab('referenceSolution')}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                                                codeTab === 'referenceSolution' 
                                                ? 'bg-[#0dccf2] text-[#051518] shadow-[0_0_15px_rgba(13,204,242,0.3)]' 
                                                : 'text-slate-400 hover:text-[#0dccf2]'
                                            }`}
                                        >
                                            REFERENCE SOLUTION
                                        </button>
                                    </div>

                                    {/* Start Code Section */}
                                    {codeTab === 'startCode' && (
                                        <div className="space-y-6">
                                            {startCodeFields.map((field, index) => (
                                                <div key={field.id} className="p-6 rounded-2xl bg-black/40 border border-[#0dccf2]/10 space-y-4 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4">
                                                        <button
                                                            type="button" 
                                                            onClick={() => removeStartCode(index)}
                                                            className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                                                        >
                                                            <span className="material-icons-round text-lg">delete_outline</span>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-4 w-full md:w-1/3">
                                                        <div className="space-y-1 w-full">
                                                            <label className="text-[10px] text-slate-500 uppercase font-bold">Language</label>
                                                            <select 
                                                                {...register(`startCode.${index}.language`)}
                                                                className="w-full bg-[#0dccf2]/5 border border-[#0dccf2]/20 rounded-lg px-3 py-2 text-sm text-[#0dccf2] focus:ring-[#0dccf2] focus:border-[#0dccf2] transition-all outline-none"
                                                            >
                                                                <option value="c">C</option>
                                                                <option value="c++">C++</option>
                                                                <option value="java">Java</option>
                                                                <option value="python">Python</option>
                                                                <option value="javascript">JavaScript</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold">InitialCode Block</label>
                                                        <div className="font-mono text-sm border border-[#0dccf2]/10 rounded-xl overflow-hidden bg-[#030d10]">
                                                            <div className="bg-[#0dccf2]/5 px-4 py-2 border-b border-[#0dccf2]/10 flex justify-between">
                                                                <span className="text-xs text-[#0dccf2]/60">code_template</span>
                                                                <span className="text-xs text-slate-500">Read-only fields highlighted</span>
                                                            </div>
                                                            <textarea 
                                                                {...register(`startCode.${index}.initialCode`)}
                                                                className="w-full bg-transparent border-none focus:ring-0 p-4 text-slate-300 custom-scroll resize-none outline-none" rows={10} 
                                                                placeholder="# User writes code here"
                                                            ></textarea>
                                                            {errors.startCode?.[index]?.initialCode && <span className="text-red-500 text-xs">{errors.startCode[index].initialCode.message}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button 
                                                type="button"
                                                onClick={() => appendStartCode({ language: 'java', initialCode: '' })}
                                                className="w-full py-4 border border-dashed border-[#0dccf2]/20 rounded-2xl text-[#0dccf2]/60 hover:text-[#0dccf2] hover:border-[#0dccf2]/40 hover:bg-[#0dccf2]/5 flex items-center justify-center gap-2 transition-all font-medium cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined">add_circle</span> Add Another Start Code Language
                                            </button>
                                        </div>
                                    )}

                                    {/* Reference Solution Section */}
                                    {codeTab === 'referenceSolution' && (
                                        <div className="space-y-6">
                                            {referenceFields.map((field, index) => (
                                                <div key={field.id} className="p-6 rounded-2xl bg-black/40 border border-[#0dccf2]/10 space-y-4 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4">
                                                        <button
                                                            type="button" 
                                                            onClick={() => removeReference(index)}
                                                            className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                                                        >
                                                            <span className="material-icons-round text-lg">delete_outline</span>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-4 w-full md:w-1/3">
                                                        <div className="space-y-1 w-full">
                                                            <label className="text-[10px] text-slate-500 uppercase font-bold">Language</label>
                                                            <select 
                                                                {...register(`referenceSolution.${index}.language`)}
                                                                className="w-full bg-[#0dccf2]/5 border border-[#0dccf2]/20 rounded-lg px-3 py-2 text-sm text-[#0dccf2] focus:ring-[#0dccf2] focus:border-[#0dccf2] transition-all outline-none"
                                                            >
                                                                <option value="c">C</option>
                                                                <option value="c++">C++</option>
                                                                <option value="java">Java</option>
                                                                <option value="python">Python</option>
                                                                <option value="javascript">JavaScript</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-slate-500 uppercase font-bold">Complete Solution</label>
                                                        <div className="font-mono text-sm border border-[#0dccf2]/10 rounded-xl overflow-hidden bg-[#030d10]">
                                                            <div className="bg-[#0dccf2]/5 px-4 py-2 border-b border-[#0dccf2]/10 flex justify-between">
                                                                <span className="text-xs text-[#0dccf2]/60">solution_code</span>
                                                                <span className="text-xs text-slate-500">Full working solution required</span>
                                                            </div>
                                                            <textarea 
                                                                {...register(`referenceSolution.${index}.completeCode`)}
                                                                className="w-full bg-transparent border-none focus:ring-0 p-4 text-slate-300 custom-scroll resize-none outline-none" rows={10} 
                                                                placeholder="# Enter complete working solution here"
                                                            ></textarea>
                                                            
                                                            {/* Accessing errors for reference solution properly */}
                                                            {errors.referenceSolution?.[index]?.completeCode && <span className="text-red-500 text-xs px-4 pb-2 block">{errors.referenceSolution[index].completeCode.message}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button 
                                                type="button"
                                                onClick={() => appendReference({ language: 'java', completeCode: '' })}
                                                className="w-full py-4 border border-dashed border-[#0dccf2]/20 rounded-2xl text-[#0dccf2]/60 hover:text-[#0dccf2] hover:border-[#0dccf2]/40 hover:bg-[#0dccf2]/5 flex items-center justify-center gap-2 transition-all font-medium cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined">add_circle</span> Add Another Reference Solution
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </section>

                            <section className="glass-panel p-8 rounded-2xl space-y-6 mb-8" id="metadata-footer">
                                <div className="flex items-center gap-3 border-b border-[#0dccf2]/10 pb-4">
                                    <span className="material-symbols-outlined text-[#0dccf2]">info</span>
                                    <h2 className="text-xl font-bold tracking-wide uppercase">Problem Metadata</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Created By (Admin)</label>
                                        <div className="w-full bg-black/20 border border-slate-700/50 rounded-xl px-4 py-3 font-mono text-slate-400 cursor-not-allowed flex items-center gap-3">
                                            <span className="material-symbols-outlined text-sm text-[#0dccf2]">person</span>
                                            {user?.name || user?.email || 'Admin'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Created At</label>
                                        <div className="w-full bg-black/20 border border-slate-700/50 rounded-xl px-4 py-3 font-mono text-slate-400 cursor-not-allowed flex items-center gap-3">
                                            <span className="material-symbols-outlined text-sm text-[#0dccf2]">schedule</span>
                                            {new Date().toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="fixed bottom-0 left-0 right-0 h-24 glass-panel border-t border-[#0dccf2]/20 flex items-center justify-center px-6 md:px-12 z-50 bg-[#051518]/90 backdrop-blur-lg">
                                <div className="max-w-7xl w-full flex items-center justify-between">
                                    <div className="hidden sm:flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Status</span>
                                        <div className="flex items-center gap-2">
                                            {statusMessage ? (
                                                <>
                                                    {isLoading ? (
                                                         <span className="w-4 h-4 border-2 border-[#0dccf2] border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusMessage.toLowerCase().includes('success') ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    )}
                                                    <span className={`text-sm font-medium tracking-tight ${isLoading ? 'text-slate-200' : statusMessage.toLowerCase().includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                                                        {statusMessage}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                    <span className="text-sm font-medium text-slate-200 tracking-tight">Drafting Problem: <span className="text-[#0dccf2]">"{watch('title') || 'Untitled'}"</span></span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 w-full sm:w-auto">
                                        <button 
                                            type="button"
                                            disabled={isLoading}
                                            onClick={handleDiscard} 
                                            className="flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-slate-700/50 cursor-pointer disabled:opacity-50"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={Object.keys(errors).length > 0 || isLoading} 
                                            className="flex-1 sm:flex-none px-12 py-3 bg-[#0dccf2] rounded-xl font-bold text-[#051518] hover:shadow-[0_0_25px_rgba(13,204,242,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-[#051518] border-t-transparent rounded-full animate-spin"></span>
                                                    Saving...
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-lg">save</span>
                                                    SAVE PROBLEM
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : activeTab === 'update' ? (
                        <div className="w-full animate-fade-in">
                            <UpdateProblem />
                        </div>
                    ) : activeTab === 'delete' ? (
                        <div className="w-full animate-fade-in">
                            <DeleteProblem />
                        </div>
                    ) : (
                         <div className="space-y-6">
                             {/* ... view mode ... */}
                            <div className="glass-panel p-8 rounded-2xl">
                                <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#0dccf2]">list_alt</span> My Problems
                                </h2>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#0dccf2]/20 text-[#0dccf2] text-xs uppercase tracking-wider">
                                                <th className="p-4">ID</th>
                                                <th className="p-4">Title</th>
                                                <th className="p-4">Difficulty</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Submissions</th>
                                                <th className="p-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {myProblems.map((problem, idx) => (
                                                <tr key={problem.id} className="border-b border-[#0dccf2]/10 hover:bg-[#0dccf2]/5 transition-colors">
                                                    <td className="p-4 font-mono text-slate-500">#{problem.id}</td>
                                                    <td className="p-4 font-bold text-slate-200">{problem.title}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                                                                problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                    'bg-red-500/10 text-red-500'
                                                            }`}>
                                                            {problem.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`flex items-center gap-2 ${problem.status === 'Published' ? 'text-blue-400' : 'text-slate-500'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${problem.status === 'Published' ? 'bg-blue-400' : 'bg-slate-500'}`}></span>
                                                            {problem.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-400">{problem.submissions}</td>
                                                    <td className="p-4 flex justify-center gap-2">
                                                        <button className="p-2 hover:bg-[#0dccf2]/20 rounded-lg text-slate-400 hover:text-[#0dccf2] transition-colors"><span className="material-icons-round text-sm">edit</span></button>
                                                        <button className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><span className="material-icons-round text-sm">delete</span></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
}

export default AdminPanel;